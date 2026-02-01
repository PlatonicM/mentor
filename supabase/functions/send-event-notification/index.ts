import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  event_id: string;
  participant_id: string;
  notification_type: "registration" | "accepted" | "reminder" | "cancelled";
}

serve(async (req: Request): Promise<Response> => {
  console.log("send-event-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { event_id, participant_id, notification_type }: NotificationRequest = await req.json();
    console.log(`Processing ${notification_type} notification for event ${event_id}, participant ${participant_id}`);

    // Fetch event details
    const { data: event, error: eventError } = await supabaseClient
      .from("live_events")
      .select(`
        *,
        courses (title)
      `)
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      console.error("Event fetch error:", eventError);
      throw new Error("Event not found");
    }

    // Fetch participant details
    const { data: participant, error: participantError } = await supabaseClient
      .from("event_participants")
      .select("*")
      .eq("id", participant_id)
      .single();

    if (participantError || !participant) {
      console.error("Participant fetch error:", participantError);
      throw new Error("Participant not found");
    }

    // Fetch user profile and auth email
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", participant.user_id)
      .single();

    const { data: authUser } = await supabaseClient.auth.admin.getUserById(participant.user_id);
    const userEmail = authUser?.user?.email;
    const userName = profile?.full_name || "Student";

    if (!userEmail) {
      console.error("User email not found for user:", participant.user_id);
      throw new Error("User email not found");
    }

    // Fetch mentor details
    const { data: mentorProfile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", event.mentor_id)
      .single();

    const { data: mentorAuth } = await supabaseClient.auth.admin.getUserById(event.mentor_id);
    const mentorEmail = mentorAuth?.user?.email;
    const mentorName = mentorProfile?.full_name || "Mentor";

    const eventDate = new Date(event.scheduled_at).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let subject = "";
    let studentHtml = "";
    let mentorHtml = "";

    switch (notification_type) {
      case "registration":
        subject = `Registration Pending: ${event.title}`;
        studentHtml = `
          <h1>Registration Received!</h1>
          <p>Hi ${userName},</p>
          <p>Your registration for <strong>${event.title}</strong> has been received and is pending approval.</p>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Duration:</strong> ${event.duration_minutes} minutes</p>
          <p>You'll receive a confirmation email once the mentor accepts your request.</p>
          <p>Best regards,<br>The Course Team</p>
        `;
        mentorHtml = `
          <h1>New Event Registration!</h1>
          <p>Hi ${mentorName},</p>
          <p><strong>${userName}</strong> has registered for your event <strong>${event.title}</strong>.</p>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p>Please review and accept or decline this registration from your dashboard.</p>
          <p>Best regards,<br>The Course Team</p>
        `;
        break;

      case "accepted":
        subject = `Registration Confirmed: ${event.title}`;
        studentHtml = `
          <h1>You're In! 🎉</h1>
          <p>Hi ${userName},</p>
          <p>Great news! Your registration for <strong>${event.title}</strong> has been accepted.</p>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Duration:</strong> ${event.duration_minutes} minutes</p>
          ${event.meeting_link ? `<p><strong>Meeting Link:</strong> <a href="${event.meeting_link}">${event.meeting_link}</a></p>` : ""}
          <p>We'll send you a reminder before the event starts.</p>
          <p>Best regards,<br>The Course Team</p>
        `;
        break;

      case "cancelled":
        subject = `Event Cancelled: ${event.title}`;
        studentHtml = `
          <h1>Event Cancelled</h1>
          <p>Hi ${userName},</p>
          <p>Unfortunately, the event <strong>${event.title}</strong> scheduled for ${eventDate} has been cancelled.</p>
          <p>We apologize for any inconvenience.</p>
          <p>Best regards,<br>The Course Team</p>
        `;
        break;

      case "reminder":
        subject = `Reminder: ${event.title} starts soon!`;
        studentHtml = `
          <h1>Event Starting Soon! ⏰</h1>
          <p>Hi ${userName},</p>
          <p>This is a reminder that <strong>${event.title}</strong> starts in 30 minutes.</p>
          <p><strong>Date:</strong> ${eventDate}</p>
          ${event.meeting_link ? `<p><strong>Join here:</strong> <a href="${event.meeting_link}">${event.meeting_link}</a></p>` : ""}
          <p>See you there!</p>
          <p>Best regards,<br>The Course Team</p>
        `;
        break;
    }

    // Send email to student
    console.log(`Sending ${notification_type} email to student: ${userEmail}`);
    const studentEmailResponse = await resend.emails.send({
      from: "Course Events <onboarding@resend.dev>",
      to: [userEmail],
      subject,
      html: studentHtml,
    });
    console.log("Student email sent:", studentEmailResponse);

    // Send email to mentor for registration notifications
    if (notification_type === "registration" && mentorEmail) {
      console.log(`Sending notification email to mentor: ${mentorEmail}`);
      const mentorEmailResponse = await resend.emails.send({
        from: "Course Events <onboarding@resend.dev>",
        to: [mentorEmail],
        subject: `New Registration: ${event.title}`,
        html: mentorHtml,
      });
      console.log("Mentor email sent:", mentorEmailResponse);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-event-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
