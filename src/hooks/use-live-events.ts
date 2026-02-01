import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: "one_on_one" | "webinar";
  mentor_id: string;
  course_id: string | null;
  meeting_link: string | null;
  scheduled_at: string;
  duration_minutes: number;
  max_participants: number | null;
  status: "scheduled" | "live" | "completed" | "cancelled";
  created_at: string;
  mentor?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  course?: {
    title: string;
  } | null;
  participant_count?: number;
  user_status?: "pending" | "accepted" | "declined" | null;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: "pending" | "accepted" | "declined";
  joined_at: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useLiveEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const { data: eventsData, error } = await supabase
        .from("live_events")
        .select(`
          *,
          courses (title)
        `)
        .in("status", ["scheduled", "live"])
        .order("scheduled_at", { ascending: true });

      if (error) throw error;

      // Fetch mentor profiles and participant counts
      const enrichedEvents = await Promise.all(
        (eventsData || []).map(async (event) => {
          // Get mentor profile
          const { data: mentorProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", event.mentor_id)
            .single();

          // Get participant count
          const { count } = await supabase
            .from("event_participants")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "accepted");

          // Get user's participation status
          let userStatus = null;
          if (user) {
            const { data: participation } = await supabase
              .from("event_participants")
              .select("status")
              .eq("event_id", event.id)
              .eq("user_id", user.id)
              .single();
            userStatus = participation?.status || null;
          }

          return {
            ...event,
            mentor: mentorProfile,
            course: event.courses,
            participant_count: count || 0,
            user_status: userStatus,
          };
        })
      );

      setEvents(enrichedEvents);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const registerForEvent = async (eventId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to register for events",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data: participant, error } = await supabase
        .from("event_participants")
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification
      await supabase.functions.invoke("send-event-notification", {
        body: {
          event_id: eventId,
          participant_id: participant.id,
          notification_type: "registration",
        },
      });

      toast({
        title: "Registration Submitted",
        description: "Your registration is pending approval",
      });

      await fetchEvents();
      return true;
    } catch (error: any) {
      console.error("Error registering:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to register",
        variant: "destructive",
      });
      return false;
    }
  };

  const cancelRegistration = async (eventId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("event_participants")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Registration Cancelled",
        description: "You have been removed from this event",
      });

      await fetchEvents();
      return true;
    } catch (error: any) {
      console.error("Error cancelling:", error);
      toast({
        title: "Error",
        description: "Failed to cancel registration",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    fetchEvents,
    registerForEvent,
    cancelRegistration,
  };
}

export function useMentorEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMentorEvents = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: eventsData, error } = await supabase
        .from("live_events")
        .select(`
          *,
          courses (title)
        `)
        .eq("mentor_id", user.id)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;

      const enrichedEvents = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { count } = await supabase
            .from("event_participants")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "accepted");

          return {
            ...event,
            course: event.courses,
            participant_count: count || 0,
          };
        })
      );

      setEvents(enrichedEvents);
    } catch (error: any) {
      console.error("Error fetching mentor events:", error);
      toast({
        title: "Error",
        description: "Failed to load your events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createEvent = async (eventData: Partial<LiveEvent>) => {
    if (!user) return null;

    try {
      const insertData = {
        title: eventData.title!,
        description: eventData.description || null,
        event_type: eventData.event_type || "webinar",
        course_id: eventData.course_id || null,
        meeting_link: eventData.meeting_link || null,
        scheduled_at: eventData.scheduled_at!,
        duration_minutes: eventData.duration_minutes || 60,
        max_participants: eventData.max_participants || null,
        mentor_id: user.id,
      };
      
      const { data, error } = await supabase
        .from("live_events")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Event Created",
        description: "Your live event has been scheduled",
      });

      await fetchMentorEvents();
      return data;
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<LiveEvent>) => {
    try {
      const { error } = await supabase
        .from("live_events")
        .update(updates)
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Event Updated",
        description: "Your event has been updated",
      });

      await fetchMentorEvents();
      return true;
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("live_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Event Deleted",
        description: "Your event has been removed",
      });

      await fetchMentorEvents();
      return true;
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
      return false;
    }
  };

  const getParticipants = async (eventId: string): Promise<EventParticipant[]> => {
    try {
      const { data, error } = await supabase
        .from("event_participants")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for participants
      const enrichedParticipants = await Promise.all(
        (data || []).map(async (participant) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", participant.user_id)
            .single();

          return {
            ...participant,
            profile,
          };
        })
      );

      return enrichedParticipants;
    } catch (error) {
      console.error("Error fetching participants:", error);
      return [];
    }
  };

  const updateParticipantStatus = async (
    participantId: string,
    eventId: string,
    status: "accepted" | "declined"
  ) => {
    try {
      const { error } = await supabase
        .from("event_participants")
        .update({ status })
        .eq("id", participantId);

      if (error) throw error;

      if (status === "accepted") {
        // Send acceptance notification
        await supabase.functions.invoke("send-event-notification", {
          body: {
            event_id: eventId,
            participant_id: participantId,
            notification_type: "accepted",
          },
        });
      }

      toast({
        title: status === "accepted" ? "Participant Accepted" : "Participant Declined",
        description: `The participant has been ${status}`,
      });

      return true;
    } catch (error: any) {
      console.error("Error updating participant:", error);
      toast({
        title: "Error",
        description: "Failed to update participant status",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchMentorEvents();
  }, [fetchMentorEvents]);

  return {
    events,
    loading,
    fetchMentorEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getParticipants,
    updateParticipantStatus,
  };
}
