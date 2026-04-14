import { createClient } from './client';

export interface UserReport {
  id: string;
  user_id: string;
  title: string;
  topic_coverage: string;
  improvements: {
    topic: string;
    status: 'Critical' | 'Moderate' | 'Excellent';
    reason: string;
    action: string;
    color: string;
  }[];
  objective_solved: number;
  objective_correct: number;
  subjective_solved: number;
  subjective_accuracy: number;
  created_at: string;
}

export async function getUserReports() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('user_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    return null;
  }

  return data as UserReport[];
}

export async function createInitialReport() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const initialData = {
    user_id: user.id,
    title: 'Initial Strategic Intelligence Briefing',
    topic_coverage: '0/100',
    improvements: [
      {
        topic: 'System Calibration',
        status: 'Moderate',
        reason: 'Your performance data is currently being calibrated as you interact with the AI Mentor.',
        action: 'Begin analyzing news articles to generate feedback.',
        color: 'default'
      }
    ],
    objective_solved: 0,
    objective_correct: 0,
    subjective_solved: 0,
    subjective_accuracy: 0
  };

  const { data, error } = await supabase
    .from('user_reports')
    .insert(initialData)
    .select()
    .single();

  if (error) {
    console.error('Error creating report:', error);
    return null;
  }

  return data as UserReport;
}
