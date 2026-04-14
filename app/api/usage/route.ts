import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserUsage } from '@/lib/supabase/usage';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const usage = await getUserUsage(user.id);

    return NextResponse.json({
      is_premium: usage.is_premium,
      usage_count: usage.usage_count,
      daily_limit: 5,
      remaining: Math.max(0, 5 - usage.usage_count),
      last_used_date: usage.last_used_date,
    });
  } catch (error: any) {
    console.error('[API/USAGE] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}
