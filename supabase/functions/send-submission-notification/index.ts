import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  submissionId: string;
  status: "approved" | "rejected" | "flagged";
  reviewerComments?: string;
  taskTitle?: string;
  attachmentTitle?: string;
}

const statusConfig = {
  approved: {
    subject: "✅ Your submission has been approved",
    heading: "Submission Approved",
    color: "#22c55e",
    message: "Great work! Your submission has been reviewed and approved.",
  },
  rejected: {
    subject: "❌ Your submission needs revision",
    heading: "Submission Rejected",
    color: "#ef4444",
    message: "Your submission has been reviewed and requires changes. Please review the feedback below and resubmit.",
  },
  flagged: {
    subject: "⚠️ Your submission has been flagged",
    heading: "Submission Flagged",
    color: "#eab308",
    message: "Your submission has been flagged for further review. Please see the comments below.",
  },
};

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { submissionId, status, reviewerComments, taskTitle, attachmentTitle }: NotificationRequest = await req.json();

    console.log(`Processing notification for submission ${submissionId}, status: ${status}`);

    // Get submission details with user info
    const { data: submission, error: submissionError } = await supabase
      .from("task_submissions")
      .select(`
        id,
        submitted_by,
        submitted_by_name,
        task_attachment_id
      `)
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      console.error("Error fetching submission:", submissionError);
      throw new Error("Submission not found");
    }

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      submission.submitted_by
    );

    if (userError || !userData?.user?.email) {
      console.error("Error fetching user:", userError);
      throw new Error("User email not found");
    }

    const userEmail = userData.user.email;
    const userName = submission.submitted_by_name || "Driver";
    const config = statusConfig[status];

    console.log(`Sending ${status} notification to ${userEmail}`);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">BMT Logistics</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="width: 60px; height: 60px; background: ${config.color}20; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 28px;">${status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⚠️'}</span>
                </div>
              </div>
              
              <h2 style="color: ${config.color}; text-align: center; margin: 0 0 15px 0;">${config.heading}</h2>
              
              <p style="margin: 0 0 20px 0;">Hi ${userName},</p>
              
              <p style="margin: 0 0 20px 0;">${config.message}</p>
              
              ${taskTitle ? `<p style="margin: 0 0 10px 0;"><strong>Task:</strong> ${taskTitle}</p>` : ''}
              ${attachmentTitle ? `<p style="margin: 0 0 20px 0;"><strong>Requirement:</strong> ${attachmentTitle}</p>` : ''}
              
              ${reviewerComments ? `
                <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid ${config.color}; margin: 20px 0;">
                  <p style="margin: 0 0 5px 0; font-weight: 600; font-size: 14px; color: #64748b;">Reviewer Comments:</p>
                  <p style="margin: 0; color: #334155;">${reviewerComments}</p>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}" style="display: inline-block; background: ${config.color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  ${status === 'approved' ? 'View Task' : 'Resubmit Now'}
                </a>
              </div>
            </div>
            
            <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">
              This is an automated notification from BMT Logistics Task Management System.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "BMT Logistics <onboarding@resend.dev>",
      to: [userEmail],
      subject: `${config.subject} - ${attachmentTitle || 'Submission'}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-submission-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
