import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // In a real app, you would verify the payment transaction ID here via a payment gateway API.
    // For this custom UPI implementation, we update the status based on user confirmation.
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Premium activated successfully!" });

  } catch (error: any) {
    console.error("[UPGRADE_API] Error:", error);
    return NextResponse.json({ error: "Failed to upgrade status: " + error.message }, { status: 500 });
  }
}
