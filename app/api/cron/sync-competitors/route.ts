import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidVanityMatch } from "@/lib/priceFilters";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const RETAILERS = ['homedepot', 'lowes', 'wayfair', 'amazon', 'walmart', 'ebay', 'target', 'bestbuy'];

const normalizeProductPrices = (prod: any) => {
  const prices = { ...prod.prices } as any;
  RETAILERS.forEach((key) => {
    if (!prices[key]) {
      prices[key] = {
        price: 0,
        inStock: true,
        url: "",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      };
    }
  });
  return { ...prod, prices };
};

export async function GET(request: Request) {
  // 1. Verify Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RETAILERAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing RETAILERAPI_KEY in environment." }, { status: 500 });
  }

  try {
    // 2. Fetch Cached Products
    const { data: cacheRow, error: cacheErr } = await supabase
      .from("price_cache")
      .select("data")
      .eq("id", "default_catalog")
      .single();

    if (cacheErr || !cacheRow) {
      return NextResponse.json({ error: "Failed to load price cache catalog from database." }, { status: 404 });
    }

    const products = cacheRow.data;
    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "Invalid price cache data format." }, { status: 500 });
    }

    const updatedProducts = JSON.parse(JSON.stringify(products)).map(normalizeProductPrices);

    console.log(`Starting competitor price sync cron for ${updatedProducts.length} products.`);

    for (let i = 0; i < updatedProducts.length; i++) {
      const product = updatedProducts[i];
      const targetUrl = `https://api.retailerapi.com/v1/products/${encodeURIComponent(
        product.upc
      )}?include_cross_retailer=true`;

      try {
        const response = await fetch(targetUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const cross = data.cross_retailer || {};

          Object.keys(product.prices).forEach((retailerKey) => {
            const apiRetailerKey = retailerKey === "lowes" ? "lowes" : retailerKey === "homedepot" ? "homedepot" : retailerKey;
            const offer = cross[apiRetailerKey];

            if (offer && offer.status !== "mismatch") {
              const offerPrice = offer.price !== null && offer.price !== undefined && offer.price > 0 ? offer.price : 0;

              // Validate match using heuristics
              const isValid = isValidVanityMatch(offer.url, offerPrice, product.mapPrice);

              if (isValid) {
                product.prices[retailerKey].price = offerPrice;
                product.prices[retailerKey].inStock = offer.in_stock !== false;
                if (offer.url) {
                  product.prices[retailerKey].url = offer.url;
                }
              } else {
                // If it is a mismatched part or vanity top, set price to 0 (N/A)
                product.prices[retailerKey].price = 0;
                product.prices[retailerKey].inStock = false;
              }
            }
          });

          product.rating = data.average_rating || product.rating || 0;
          product.reviewCount = data.review_count || product.reviewCount || 0;
          console.log(`Successfully synced product pricing for: ${product.name}`);
        } else {
          console.error(`Retailer API returned error status ${response.status} for UPC ${product.upc}`);
        }
      } catch (singleErr) {
        console.error(`Failed scanning ${product.name} (UPC ${product.upc}):`, singleErr);
      }

      // Respect rate limits of Retailer API (2.5s delay)
      if (i < updatedProducts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    }

    // 3. Save Updated Cache with Timestamp
    const timestamp = new Date().toISOString();
    const { error: saveErr } = await supabase
      .from("price_cache")
      .upsert({ 
        id: "default_catalog", 
        data: updatedProducts,
        updated_at: timestamp 
      });

    if (saveErr) {
      throw new Error(`Failed to save updated catalog to Supabase: ${saveErr.message}`);
    }

    return NextResponse.json({
      status: "ok",
      synced_at: timestamp,
      products_count: updatedProducts.length
    });

  } catch (err: any) {
    console.error("Competitor sync cron failed:", err);
    return NextResponse.json({ error: err.message || "An unexpected error occurred." }, { status: 500 });
  }
}
