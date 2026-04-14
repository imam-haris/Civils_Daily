import { createAdminClient } from './admin';

export interface UserUsage {
  is_premium: boolean;
  usage_count: number;
  last_used_date: string;
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('profiles')
    .select('is_premium, usage_count, last_used_date')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    if (error.message.includes('does not exist')) {
      console.warn('[USAGE] Database columns missing. Please run the migration SQL. Defaulting to Free.');
      return { is_premium: false, usage_count: 0, last_used_date: today };
    }
    console.error('[USAGE] Fetch error:', error.message);
    return { is_premium: false, usage_count: 0, last_used_date: today };
  }

  // If new user or date mismatch, reset count (but keep premium status)
  if (!data || data.last_used_date !== today) {
    // Upsert to reset for today
    try {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          last_used_date: today,
          usage_count: 0,
          is_premium: data?.is_premium ?? false
        });
      
      if (upsertError) {
        if (upsertError.message.includes('does not exist')) {
           console.warn('[USAGE] Cannot update usage: columns missing.');
        } else {
           console.error('[USAGE] Upsert error:', upsertError.message);
        }
      }
    } catch (e) {
      console.error('[USAGE] Upsert exception:', e);
    }
    
    return { is_premium: data?.is_premium ?? false, usage_count: 0, last_used_date: today };
  }

  return data;
}

export async function incrementUsage(userId: string) {
  const supabase = createAdminClient();
  
  // Try RPC first (best performance/atomicity)
  const { error: rpcError } = await supabase.rpc('increment_usage', { user_id: userId });
  
  if (rpcError) {
    console.warn('[USAGE] RPC failed, trying direct update:', rpcError.message);
    
    // Fallback: manually increment
    try {
      const { data: current, error: fetchError } = await supabase
        .from('profiles')
        .select('usage_count')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ usage_count: (current?.usage_count || 0) + 1 })
        .eq('id', userId);
        
      if (updateError) throw updateError;
      console.log('[USAGE] Usage successfully incremented via direct update');
    } catch (err: any) {
      console.error('[USAGE] All increment attempts failed:', err.message);
    }
  } else {
    console.log('[USAGE] Usage incremented successfully via RPC');
  }
}
