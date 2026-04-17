import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Resend } from 'resend';

// Initialize Resend (User needs to add RESEND_API_KEY to .env.local)
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  console.log("[PAYMENT_REQUEST_API] Received request");

  try {
    // 1. Get user session using the standard SSR client (which has access to cookies)
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "Session not found. Please log in again." }, { status: 401 });
    }

    const userId = user.id;
    const adminSupabase = createAdminClient(); // Use admin client for privileged ops (storage/DB)

    const formData = await req.formData();
    const screenshot = formData.get("screenshot") as File;

    if (!screenshot) {
      return NextResponse.json({ error: "Screenshot is required" }, { status: 400 });
    }

    // 2. Upload to Supabase Storage
    const fileExt = screenshot.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `screenshots/${fileName}`;

    const { data: uploadData, error: uploadError } = await adminSupabase
      .storage
      .from('payments')
      .upload(filePath, screenshot, {
        upsert: true,
        contentType: screenshot.type
      });

    if (uploadError) {
      console.error("[PAYMENT_REQUEST_API] Upload failed:", uploadError);
      return NextResponse.json({ error: "Failed to upload screenshot: " + uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = adminSupabase.storage.from('payments').getPublicUrl(filePath);

    // 3. Insert into Database
    const { error: dbError } = await adminSupabase
      .from('payment_requests')
      .insert({
        user_id: userId,
        screenshot_url: publicUrl,
        status: 'pending'
      });

    if (dbError) {
      console.error("[PAYMENT_REQUEST_API] DB Insert failed:", dbError);
      return NextResponse.json({ error: "Failed to save request: " + dbError.message }, { status: 500 });
    }

    // 4. Send Email to Admin (Optional but requested)
    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'Civils Daily <onboarding@resend.dev>',
          to: 'imamharis1701@gmail.com',
          subject: 'New Premium Payment Verification Request',
          html: `
            <h3>New Payment Request</h3>
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>Screenshot:</strong> <a href="${publicUrl}">View Screenshot</a></p>
            <p>Please verify the payment and upgrade the user status in Supabase.</p>
          `
        });
        console.log("[PAYMENT_REQUEST_API] Admin email sent via Resend");
      } else {
        console.log("[PAYMENT_REQUEST_API] Admin notification (Mock): Email would be sent to haris.imam1701@gmail.com");
      }
    } catch (emailError) {
      console.error("[PAYMENT_REQUEST_API] Email notification failed:", emailError);
      // We don't fail the whole request if email fails, as DB record is saved
    }

    return NextResponse.json({ success: true, message: "Request submitted" });

  } catch (error: any) {
    console.error("[PAYMENT_REQUEST_API] Fatal Error:", error);
    return NextResponse.json({ error: "Internal Server Error: " + error.message }, { status: 500 });
  }
}
