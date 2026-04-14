import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const dynamic = 'force-dynamic';

interface QuizQuestion {
  id: number;
  type: 'mcq' | 'tf' | 'match';
  question: string;
  options?: string[];
  answer: string | any;
  explanation: string;
}

// Layer 1: In-memory cache
let dailyQuizCache: { date: string; questions: QuizQuestion[] } | null = null;

export async function GET(req: NextRequest) {
  const now = new Date();
  const currentHour = now.getHours();
  let quizDate = now.toISOString().split('T')[0];
  
  if (currentHour < 10) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    quizDate = yesterday.toISOString().split('T')[0];
  }

  // ── Step 1: Check Memory ──
  if (dailyQuizCache && dailyQuizCache.date === quizDate) {
    return NextResponse.json({ questions: dailyQuizCache.questions });
  }

  const supabase = createAdminClient();

  // ── Step 2: Check Database ──
  try {
    const { data: dbQuiz, error: dbError } = await supabase
      .from('daily_quizzes')
      .select('questions')
      .eq('quiz_date', quizDate)
      .maybeSingle();

    if (dbQuiz?.questions) {
      console.log(`[QUIZ API] Cache HIT (DB) for ${quizDate}`);
      dailyQuizCache = { date: quizDate, questions: dbQuiz.questions };
      return NextResponse.json({ questions: dbQuiz.questions });
    }
    
    if (dbError) console.error('[QUIZ API] DB Error:', dbError.message);
  } catch (err) {
    console.warn('[QUIZ API] DB fallback failed, proceeding to generation.');
  }

  // ── Step 3: Generation ──
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) throw new Error('GNEWS_API_KEY missing');

    console.log('[QUIZ API] Generation START for', quizDate);
    
    const newsRes = await fetch(`https://gnews.io/api/v4/top-headlines?category=general&lang=en&country=in&max=15&apikey=${apiKey}`);
    const newsData = await newsRes.json();
    
    if (!newsData.articles || newsData.articles.length === 0) {
      throw new Error('No news articles found');
    }

    const articleSummaries = newsData.articles
      .slice(0, 8)
      .map((a: any) => `Title: ${a.title}\nDescription: ${a.description}`)
      .join('\n\n');

    const prompt = `Based on the news article summaries from ${quizDate}, generate a High-Difficulty, Highly Analytical Daily Quiz for Civil Services aspirants.
     Generate EXACTLY 20 questions in JSON format.
     
     Style & Difficulty:
     - The difficulty must be VERY HIGH. 
     - Use complex formats like "Consider the following statements", followed by statements, and then options like "Only one statement is correct", "Only two", "All three", or "None".
     - Questions should test deep conceptual understanding and multi-dimensional analysis of the news, not just factual recall.
     - DO NOT mention the word "UPSC" anywhere in the questions or explanations.
     
     Types: 
     - MCQ: Complex multiple choice with 4 options.
     - TF: Analytical True or False statements.
     
     Articles:
     ${articleSummaries}
     
     Return ONLY a JSON object with the following structure:
     {
       "questions": [
         {
           "id": 1,
           "type": "mcq",
           "question": "Detailed question text following Civil Services pattern",
           "options": ["Option A", "Option B", "Option C", "Option D"],
           "answer": "The exact full text of the correct choice",
           "explanation": "Deep strategic and conceptual background"
         },
         {
           "id": 2,
           "type": "tf",
           "question": "Analytical statement content",
           "answer": "True",
           "explanation": "Detailed reasoning"
         }
       ]
     }
     
     Rules:
     - 15 MCQs must be of the "Consider the following statements" / "How many items are correct" style.
     - 5 True/False must be highly analytical.
     - Never use the term "UPSC".`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "You are a Senior Civil Services Examiner. You generate highly sophisticated, difficult, and analytical questions. You always output valid JSON and never mention 'UPSC' in your content." }, { role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });


    const parsedData = JSON.parse(aiResponse.choices[0].message?.content || '{}');
    let questions = parsedData.questions;

    if (!questions || !Array.isArray(questions)) throw new Error('AI failed to generate valid questions');

    // ── Step 4: Validation & Normalization ──
    const validatedQuestions = questions.map((q: any, idx: number) => {
      // Ensure IDs are sequential and numeric
      q.id = idx + 1;
      
      // Basic type normalization
      const type = (q.type || 'mcq').toLowerCase();
      q.type = (type === 'tf' || type === 'true_false') ? 'tf' : 'mcq';

      if (q.type === 'mcq') {
        // Force options to be an array of 4
        if (!Array.isArray(q.options) || q.options.length < 2) {
          // If options are missing, we can't reliably use the question
          return null;
        }
        // Slice if too many, pad if too few (rare with gpt-4o-mini but possible)
        q.options = q.options.slice(0, 4);
        while (q.options.length < 4) q.options.push(`Choice ${q.options.length + 1}`);
      } else {
        // TF questions don't need options array in DB, but we ensure answer is 'True'/'False'
        const ans = String(q.answer).toLowerCase();
        q.answer = ans.includes('t') ? 'True' : 'False';
        q.options = ['True', 'False'];
      }

      return q;
    }).filter(Boolean);

    if (validatedQuestions.length === 0) throw new Error('All generated questions were invalid');

    // ── Step 5: Store results ──
    const { error: insertError } = await supabase
      .from('daily_quizzes')
      .insert({
        quiz_date: quizDate,
        questions: validatedQuestions
      });

    if (insertError) {
      console.error('[QUIZ API] Storage Error:', insertError.message);
    }

    dailyQuizCache = { date: quizDate, questions: validatedQuestions };
    return NextResponse.json({ questions: validatedQuestions });


  } catch (error: any) {
    console.error('[QUIZ API ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate quiz' }, { status: 500 });
  }
}
