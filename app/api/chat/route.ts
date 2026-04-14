import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserUsage, incrementUsage } from "@/lib/supabase/usage";

export const runtime = "nodejs"; // ✅ ensure server runtime

export async function POST(req: NextRequest) {
  try {
    // ✅ Validate API key FIRST (prevents build-time crash)
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // ✅ Initialize ONLY inside handler (safe for Vercel)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { messages, articleTitle, articleContent } = await req.json();

    // ── User Check ──
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Auth required for AI features" },
        { status: 401 }
      );
    }

    const usage = await getUserUsage(user.id);

    const isFirstMessage =
      messages?.length === 1 &&
      messages[0]?.content?.toLowerCase().includes("summary");

    // ── Free Limit Check ──
    if (!usage.is_premium && usage.usage_count >= 5 && isFirstMessage) {
      return NextResponse.json(
        {
          error: "LIMIT_REACHED",
          message:
            "You have used your 5 free AI briefings for today. Upgrade to Premium for unlimited access and deep subjective discussions.",
        },
        { status: 402 }
      );
    }

    // ── Strict Free Restriction After MCQs ──
    if (!usage.is_premium && !isFirstMessage) {
      const assistantMessages = messages.filter(
        (m: any) => m.role === "assistant"
      );

      const hasCompletedMCQs = assistantMessages.some((m: any) =>
        m.content?.includes("MCQ 6/6")
      );

      const hasReceivedPremiumNotice = assistantMessages.some((m: any) =>
        m.content?.includes("reserved for PREMIUM")
      );

      if (hasCompletedMCQs && hasReceivedPremiumNotice) {
        return NextResponse.json({
          role: "assistant",
          content:
            "You've completed the assessment phase for this article. Deep subjective discussion and mains-evaluation is reserved for our Premium members. Upgrade to Premium (₹199/mo) to unlock expert analysis and answer writing evaluation for this topic!",
        });
      }
    }

    // ── System Prompt ──
    const systemPrompt = `You are CogniClash, a critical AI Exam Mentor for competitive exam aspirants. 
Topic: "${articleTitle}".

User Status: ${usage.is_premium ? "PREMIUM (Full access)" : "FREE (Limited to MCQs only)"
      }

Article Context:
${articleContent}

1. Initial Message: Provide a 3-facet bulleted summary. Immediately follow with "MCQ 1/6".
2. MCQ Phase: Guide through 6 MCQs using format "MCQ X/6". MCQs must be of High-Difficulty and Highly Analytical style (e.g., "Consider the following statements").
3. Subjective Phase:
   - PREMIUM: Provide deep analysis + evaluation
   - FREE: Stop after MCQ 6 and push upgrade

${!usage.is_premium
        ? "CRITICAL: Do NOT provide subjective analysis. Stop after MCQs."
        : ""
      }

Difficulty: Very High.
Style: Senior Civil Services level, analytical, authoritative. DO NOT use the term "UPSC".`;

    // ── OpenAI Call ──
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...(messages || []).map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    });

    const content = response.choices?.[0]?.message?.content || "";

    // ── Usage Increment ──
    if (isFirstMessage) {
      await incrementUsage(user.id);
    }

    return NextResponse.json({
      role: "assistant",
      content,
    });
  } catch (error: any) {
    console.error("[API/CHAT] Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch AI response" },
      { status: 500 }
    );
  }
}