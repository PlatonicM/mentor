import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  console.log("send-event-reminders function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

    // Fetch events starting in the next 24-25 hours that haven't had 24h reminder sent
    const { data: events24h, error: events24hError } = await supabaseClient
      .from("live_events")
      .select(`
        *,
        event_participants!inner (
          id,
          user_id,
          status,
          reminder_24h_sent
        )
      `)
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", in24Hours.toISOString())
      .eq("event_participants.status", "accepted")
      .eq("event_participants.reminder_24h_sent", false);

    if (events24hError) {
      console.error("Error fetching 24h events:", events24hError);
    }

    // Fetch events starting in the next 1-2 hours that haven't had 1h reminder sent
    const { data: events1h, error: events1hError } = await supabaseClient
      .from("live_events")
      .select(`
        *,
        event_participants!inner (
          id,
          user_id,
          status,
          reminder_1h_sent
        )
      `)
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", in1Hour.toISOString())
      .eq("event_participants.status", "accepted")
      .eq("event_participants.reminder_1h_sent", false);

    if (events1hError) {
      console.error("Error fetching 1h events:", events1hError);
    }

    let remindersSent = 0;

    // Process 24-hour reminders
    if (events24h && events24h.length > 0) {
      for (const event of events24h) {
        for (const participant of event.event_participants) {
          try {
            // Send email reminder
            await sendReminderEmail(supabaseClient, event, participant.user_id, "24h");
            
            // Create in-app notification
            await createReminderNotification(supabaseClient, event, participant.user_id, "24h");
            
            // Mark reminder as sent
            await supabaseClient
              .from("event_participants")
              .update({ reminder_24h_sent: true })
              .eq("id", participant.id);
            
            remindersSent++;
            console.log(`24h reminder sent for event ${event.id}, participant ${participant.id}`);
          } catch (err) {
            console.error(`Failed to send 24h reminder:`, err);
          }
        }
      }
    }

    // Process 1-hour reminders
    if (events1h && events1h.length > 0) {
      for (const event of events1h) {
        for (const participant of event.event_participants) {
          try {
            // Send email reminder
            await sendReminderEmail(supabaseClient, event, participant.user_id, "1h");
            
            // Create in-app notification
            await createReminderNotification(supabaseClient, event, participant.user_id, "1h");
            
            // Mark reminder as sent
            await supabaseClient
              .from("event_participants")
              .update({ reminder_1h_sent: true })
              .eq("id", participant.id);
            
            remindersSent++;
            console.log(`1h reminder sent for event ${event.id}, participant ${participant.id}`);
          } catch (err) {
            console.error(`Failed to send 1h reminder:`, err);
          }
        }
      }
    }

    console.log(`Total reminders sent: ${remindersSent}`);

    return new Response(
      JSON.stringify({ success: true, remindersSent }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-event-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

async function sendReminderEmail(
  supabaseClient: any,
  event: any,
  userId: string,
  reminderType: "24h" | "1h"
) {
  // Fetch user profile and email
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("full_name")
    .eq("user_id", userId)
    .single();

  const { data: authUser } = await supabaseClient.auth.admin.getUserById(userId);
  const userEmail = authUser?.user?.email;
  const userName = profile?.full_name || "Student";

  if (!userEmail) {
    throw new Error(`User email not found for user: ${userId}`);
  }

  const eventDate = new Date(event.scheduled_at).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const timeUntilEvent = reminderType === "24h" ? "24 hours" : "1 hour";
  const urgency = reminderType === "1h" ? "⏰ " : "";

  const subject = `${urgency}Reminder: ${event.title} starts in ${timeUntilEvent}!`;
  const html = `
    <h1>${urgency}Event Reminder</h1>
    <p>Hi ${userName},</p>
    <p>This is a friendly reminder that <strong>${event.title}</strong> starts in <strong>${timeUntilEvent}</strong>.</p>
    <p><strong>Date & Time:</strong> ${eventDate}</p>
    <p><strong>Duration:</strong> ${event.duration_minutes} minutes</p>
    ${event.meeting_link ? `<p><strong>Join here:</strong> <a href="${event.meeting_link}" style="color: #4F46E5; text-decoration: underline;">${event.meeting_link}</a></p>` : ""}
    ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ""}
    <br/>
    ${reminderType === "1h" ? "<p><strong>Don't forget to join on time!</strong></p>" : "<p>We'll send you another reminder 1 hour before the event.</p>"}
    <p>Best regards,<br>The Course Team</p>
  `;

  const emailResponse = await resend.emails.send({
    from: "Course Events <onboarding@resend.dev>",
    to: [userEmail],
    subject,
    html,
  });

  console.log(`Reminder email sent to ${userEmail}:`, emailResponse);
  return emailResponse;
}

async function createReminderNotification(
  supabaseClient: any,
  event: any,
  userId: string,
  reminderType: "24h" | "1h"
) {
  const timeUntilEvent = reminderType === "24h" ? "24 hours" : "1 hour";
  const urgencyEmoji = reminderType === "1h" ? "⏰ " : "📅 ";
  
  const eventDate = new Date(event.scheduled_at).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const title = `${urgencyEmoji}Event Reminder`;
  const message = `"${event.title}" starts in ${timeUntilEvent} (${eventDate})${reminderType === "1h" && event.meeting_link ? " - Join now!" : ""}`;

  const { error } = await supabaseClient
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type: "event",
      link: "/events",
    });

  if (error) {
    console.error(`Failed to create notification for user ${userId}:`, error);
    throw error;
  }

  console.log(`In-app notification created for user ${userId}, event ${event.id}`);
}
