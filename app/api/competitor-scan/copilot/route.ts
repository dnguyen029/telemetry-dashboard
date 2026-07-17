import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// CORS headers configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { message, products } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message query is required" }, { status: 400, headers: corsHeaders });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured on the server" }, { status: 500, headers: corsHeaders });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `You are the Ariel Bath Pricing Copilot, a friendly and highly strategic AI pricing analyst.
Your job is to help the user analyze competitor prices, evaluate inventory risk, and draft customer or retailer emails based on the live data provided below.

Here is the active pricing catalog data from the dashboard:
${JSON.stringify(products || [], null, 2)}

Strict Guidelines:
1. Explain findings simply and practically, speaking directly in conversational business terms (no robotic jargon or military-like phrasing).
2. If the user asks you to draft an email, letter, or notice to a store (like Lowe's or Amazon), write out the complete, copy-pasteable email body. Use the real product model, pricing numbers, and store names found in the data above.
3. Keep your advice strategic and focused on maximizing margins and correcting price drops below the floor.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.3,
      }
    });

    const reply = response.text || "I was unable to analyze that request. Please try again.";
    return NextResponse.json({ reply }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Gemini Copilot API Error:", error);
    return NextResponse.json({ 
      error: "Unable to process pricing query", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500, headers: corsHeaders });
  }
}
