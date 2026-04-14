import { createAdminClient } from './admin';

export interface UserUsage {
  is_premium: boolean;
  usage_count: number;
  last_used_date: string;
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  console.log(`[USAGE] Fetching usage for user: ${userId}, today: ${today}`);

  const { data, error } = await supabase
    .from('profiles')
    .select('is_premium, usage_count, last_used_date')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[USAGE] Fetch error:', error.message);
    // If table missing, we can't do much, return default to not block user but log it
    return { is_premium: false, usage_count: 0, last_used_date: today };
  }

  // If new user or date mismatch, reset count (but keep premium status)
  if (!data || data.last_used_date !== today) {
    const isPremium = data?.is_premium ?? false;
    console.log(`[USAGE] Resetting usage for user: ${userId}. Reason: ${!data ? 'No data' : `Date mismatch (${data.last_used_date} vs ${today})`}`);
    
    // Upsert to reset for today - explicitly handle conflict on 'id'
    try {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          last_used_date: today,
          usage_count: 0,
          is_premium: isPremium
        }, { onConflict: 'id' });
      
      if (upsertError) {
        console.error('[USAGE] Upsert error during reset:', upsertError.message);
        // If upsert failed, we still return 0 but the DB might be out of sync
      }
    } catch (e) {
      console.error('[USAGE] Upsert exception during reset:', e);
    }
    
    return { is_premium: isPremium, usage_count: 0, last_used_date: today };
  }

  console.log(`[USAGE] Current usage for user ${userId}: ${data.usage_count}/5`);
  return data;
}

export async function incrementUsage(userId: string) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  console.log(`[USAGE] Incrementing usage for user: ${userId}`);

  // We want to ensure we update last_used_date too if we are using fallback
  const { error } = await supabase.rpc('increment_usage', { user_id: userId });
  
  if (error) {
    console.warn('[USAGE] RPC increment failed, trying manual update:', error.message);
    // Fallback if RPC doesn't exist yet or fails
    const { data: current } = await supabase
      .from('profiles')
      .select('usage_count, last_used_date, is_premium')
      .eq('id', userId)
      .maybeSingle();

    // If no row exists yet at all (unlikely if getUserUsage was called), upsert it
    await supabase.from('profiles').upsert({ 
      id: userId, 
      usage_count: (current?.usage_count || 0) + 1,
      last_used_date: today,
      is_premium: current?.is_premium ?? false
    }, { onConflict: 'id' });
  }
}
