import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Admin client that bypasses RLS for reliable writes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Get user from cookie-based auth
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[API/SYNC] No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[API/SYNC] User authenticated: ${user.id}`);

    const { messages, articleTitle } = await req.json();
    console.log(`[API/SYNC] Syncing for: "${articleTitle}" (${messages?.length} messages)`);

    const analysisPrompt = `You are CogniClash Intelligence Sync. Analyze the study interaction about: "${articleTitle}".
    
    Conversation History:
    ${JSON.stringify(messages)}

    Objective:
    Count how many questions have been fully completed in this session:
    - An MCQ is "Solved" if the user provided an answer AND the AI responded with feedback.
    - LOOK for patterns like "Multiple Choice Question 1/6", "Question 2/6", "MCQ", numbered questions with options (A), (B), (C), (D).
    - An MCQ is "Correct" if the AI's feedback confirmed the user's answer was correct.
    - A Subjective question is "Solved" if the user wrote a descriptive analytical response.
    - "Subjective Accuracy" (0-100) reflects depth and critical quality of their arguments.

    IMPORTANT: Be precise. Count each distinct question separately.

    Return EXACTLY this JSON:
    {
      "performance": {
        "objective_solved": (total MCQs the user answered),
        "objective_correct": (how many the user got right),
        "subjective_solved": (total subjective questions the user answered),
        "subjective_accuracy": (quality percentage 0-100)
      },
      "topic_coverage_increment": (1 if a new topic was covered, else 0),
      "improvement": {
        "topic": (string - the main topic area),
        "status": ("Critical" | "Moderate" | "Excellent"),
        "reason": (one sentence feedback on their performance),
        "action": (one specific recommendation)
      }
    }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: analysisPrompt }],
      response_format: { type: 'json_object' }
    });

    const parsedUpdate = JSON.parse(response.choices[0].message.content || '{}');
    const stats = parsedUpdate.performance || {};
    console.log('[API/SYNC] AI Extracted:', JSON.stringify(stats));

    // Use admin client to fetch existing report (bypasses RLS)
    const { data: existingReport, error: fetchError } = await supabaseAdmin
      .from('user_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error('[API/SYNC] Error fetching report:', fetchError.message);
      return NextResponse.json({ error: 'No report found' }, { status: 404 });
    }

    console.log('[API/SYNC] Existing report found:', existingReport.id);
    console.log('[API/SYNC] Current DB values:', {
      objective_solved: existingReport.objective_solved,
      objective_correct: existingReport.objective_correct,
      subjective_solved: existingReport.subjective_solved,
      subjective_accuracy: existingReport.subjective_accuracy,
    });

    // Calculate new cumulative values
    const newObjectiveSolved = (existingReport.objective_solved || 0) + (stats.objective_solved || 0);
    const newObjectiveCorrect = (existingReport.objective_correct || 0) + (stats.objective_correct || 0);
    const newSubjectiveSolved = (existingReport.subjective_solved || 0) + (stats.subjective_solved || 0);
    
    const newSubjectiveAccuracy = stats.subjective_solved > 0 
      ? Math.round(
          ((existingReport.subjective_accuracy || 0) * (existingReport.subjective_solved || 0) 
           + (stats.subjective_accuracy || 0) * (stats.subjective_solved || 0)) 
          / (newSubjectiveSolved || 1)
        )
      : (existingReport.subjective_accuracy || 0);

    const currentCoverageNum = parseInt(existingReport.topic_coverage?.split('/')[0] || '0');
    const newCoverage = `${Math.min(100, currentCoverageNum + (parsedUpdate.topic_coverage_increment || 0))}/100`;

    const updatedImprovements = [
      parsedUpdate.improvement,
      ...(existingReport.improvements || []).slice(0, 4)
    ];

    const updatePayload = {
      topic_coverage: newCoverage,
      improvements: updatedImprovements,
      objective_solved: newObjectiveSolved,
      objective_correct: newObjectiveCorrect,
      subjective_solved: newSubjectiveSolved,
      subjective_accuracy: newSubjectiveAccuracy,
      title: `Civils Daily Update: ${articleTitle}`
    };

    console.log('[API/SYNC] Writing to DB:', JSON.stringify(updatePayload));

    // Use admin client for the update (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from('user_reports')
      .update(updatePayload)
      .eq('id', existingReport.id);

    if (updateError) {
      console.error('[API/SYNC] DB UPDATE ERROR:', updateError.message);
      throw updateError;
    }

    console.log('[API/SYNC] ✅ Successfully updated report');
    return NextResponse.json({ success: true, update: parsedUpdate });
  } catch (error: any) {
    console.error('[API/SYNC] Fatal Error:', error.message || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
