import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to read cache safely from Supabase
async function getCachedProducts() {
  try {
    const { data, error } = await supabase
      .from("price_cache")
      .select("data")
      .eq("id", "default_catalog")
      .single();

    if (error || !data) {
      console.error("Supabase select error:", error);
      return null;
    }
    return data.data;
  } catch (error) {
    console.error("Failed to query Supabase price cache:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const cached = await getCachedProducts();
    if (!cached) {
      return new Response(
        JSON.stringify({ error: "Cache file not initialized" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to read cache" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { products } = body;

    if (products && Array.isArray(products)) {
      const { error } = await supabase
        .from("price_cache")
        .upsert({ id: "default_catalog", data: products });

      if (error) {
        throw new Error(error.message);
      }

      return new Response(JSON.stringify(products), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Missing 'products' array payload for caching." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update cache" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
