import OpenAI from "openai";
import { createAdminClient } from "./supabase/admin";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface Question {
  id: number;
  text: string;
  source: string;
  paper: string;
}

export async function getDailyQuestions() {
  const today = new Date().toISOString().split('T')[0];
  const supabase = createAdminClient();

  // 1. Check Supabase for today's questions first
  try {
    const { data: cached, error } = await supabase
      .from('daily_evaluation_questions')
      .select('content')
      .eq('date', today)
      .maybeSingle();

    if (cached && cached.content) {
      console.log("[QUESTIONS_LIB] Cache hit (Supabase) for:", today);
      return cached.content as Record<string, Question[]>;
    }
  } catch (e) {
    console.warn("[QUESTIONS_LIB] Cache check failed:", e);
  }

  console.log("[QUESTIONS_LIB] Cache miss. Generating with OpenAI for:", today);

  // 2. Fetch news context for grounding
  const apiKey = process.env.GNEWS_API_KEY;
  let context = "Recent Indian news on Polity, Economy, and International Relations.";
  
  try {
    const newsRes = await fetch(`https://gnews.io/api/v4/top-headlines?category=general&lang=en&country=in&max=10&apikey=${apiKey}`);
    if (newsRes.ok) {
      const newsData = await newsRes.json();
      context = newsData.articles.map((a: any) => a.title).join(". ");
    }
  } catch (e) {
    console.warn("News fetch error, using default context");
  }

  // 3. Generate questions via OpenAI
  const prompt = `You are a UPSC expert. Generate 2 Mains-style subjective questions for EACH of the following GS papers based on these recent news headlines: "${context}".
  
GS Paper I (History, Geography, Society)
GS Paper II (Polity, Governance, IR)
GS Paper III (Economy, S&T, Environment)
GS Paper IV (Ethics)

Format: Return a JSON object where keys are gs1, gs2, gs3, gs4. Each value is an array of 2 objects: { text: string, source: string }.
The questions should be analytical and standard for Civil Services (150-250 words style).`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "You are a UPSC content generator." }, { role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const questions = JSON.parse(completion.choices[0].message.content || "{}");
    
    // Transform to include IDs and paper labels
    let idCounter = 1;
    const formatted: Record<string, Question[]> = {};
    for (const paper of ['gs1', 'gs2', 'gs3', 'gs4']) {
      formatted[paper] = (questions[paper] || []).map((q: any) => ({
        ...q,
        id: idCounter++,
        paper
      }));
    }

    // 4. Cache in Supabase for the whole day
    const { error: upsertError } = await supabase
      .from('daily_evaluation_questions')
      .upsert({ date: today, content: formatted });

    if (upsertError) {
      console.error("[QUESTIONS_LIB] Failed to cache in Supabase:", upsertError.message);
    }

    return formatted;

  } catch (error) {
    console.error("Question generation failed:", error);
    // Hardcoded fallback if everything fails
    return {
      gs1: [{ id: 1, text: "Critically examine the impact of urbanization on traditional Indian family structures.", source: "Soc. Issues", paper: "gs1" }],
      gs2: [{ id: 2, text: "The concept of 'Basic Structure' has served as a safety valve for Indian Democracy. Comment.", source: "Polity", paper: "gs2" }],
      gs3: [{ id: 3, text: "Discuss the role of Digital Public Infrastructure (DPI) in achieving inclusive growth in India.", source: "Economy", paper: "gs3" }],
      gs4: [{ id: 4, text: "Emotional intelligence is often more important than IQ for an administrator. Discuss with examples.", source: "Ethics", paper: "gs4" }]
    };
  }
}
