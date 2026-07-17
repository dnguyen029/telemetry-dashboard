import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RETAILERAPI_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing RETAILERAPI_KEY environment variable." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { identifier } = body;

    if (!identifier) {
      return new Response(
        JSON.stringify({ error: "Missing product 'identifier' parameter (UPC/ASIN/GTIN/URL)." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const targetUrl = `https://api.retailerapi.com/v1/products/${encodeURIComponent(
      identifier
    )}?include_cross_retailer=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9500);

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(
          JSON.stringify({
            error: `Retailer API returned error status ${response.status}`,
            details: errorText,
          }),
          { status: response.status, headers: { "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr.name === "AbortError";
      return new Response(
        JSON.stringify({
          error: isTimeout ? "Retailer API request timed out after 6 seconds." : fetchErr.message,
        }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred during the scan." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
