import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  console.log("[EVALUATION_API] Request received");
  
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // userId can be null for anonymous users in this demo
    const userId = user?.id || "anonymous";

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const questionText = formData.get("questionText") as string;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("[EVALUATION_API] OpenAI key missing");
      return NextResponse.json({ error: "AI configuration missing" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1. Extract text from PDF
    let extractedText = "";
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Load pdf-parse dynamically to handle potential module errors
      const pdf = require("pdf-parse");
      const data = await pdf(buffer);
      extractedText = data.text || "";
      console.log("[EVALUATION_API] Text extracted, length:", extractedText.length);
    } catch (err: any) {
      console.warn("[EVALUATION_API] PDF parse failed, falling back to empty text:", err.message);
      // We continue since AI can evaluate based on question + dummy content or mention extraction failed
      extractedText = "";
    }

    // ── Prompt for UPSC Evaluation ──
    const systemPrompt = `You are a Senior UPSC Mains Examiner. 
Critically evaluate the student's answer for this question: "${questionText}".

Student Answer Text:
"${extractedText.slice(0, 4000) || "NO TEXT DETECTED (Handwritten scan provided)"}"

Evaluation Criteria:
1. Content Accuracy & Depth (40%)
2. Structure (Intro, Body, Conclusion) (20%)
3. Logic & Flow (20%)
4. Presentation (Bullet points, head/subheads) (10%)
5. Language & Context (10%)

Output Format (JSON ONLY):
{
  "score": number (out of 10),
  "feedback": {
    "strengths": string[],
    "improvements": string[],
    "detailed_remark": string
  }
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Provide the evaluation for the uploaded answer." }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    console.log("[EVALUATION_API] Evaluation successful for user:", userId);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[EVALUATION_API] Fatal Error:", error);
    // Return JSON even on error to prevent front-end 'Unexpected token <'
    return NextResponse.json({ 
      error: "Analysis failed", 
      message: error.message,
      score: 0,
      feedback: { 
        strengths: [], 
        improvements: ["System encountered an error during processing"], 
        detailed_remark: "Please ensure your PDF is not password protected and try again. Technical details: " + error.message
      }
    }, { status: 500 });
  }
}
