import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_event_registration: boolean;
  email_event_reminder_24h: boolean;
  email_event_reminder_1h: boolean;
  email_course_updates: boolean;
  email_marketing: boolean;
  push_event_reminder_24h: boolean;
  push_event_reminder_1h: boolean;
  push_course_updates: boolean;
  inapp_event_registration: boolean;
  inapp_event_reminder_24h: boolean;
  inapp_event_reminder_1h: boolean;
  inapp_course_updates: boolean;
}

const defaultPreferences: Omit<NotificationPreferences, "id" | "user_id"> = {
  email_event_registration: true,
  email_event_reminder_24h: true,
  email_event_reminder_1h: true,
  email_course_updates: true,
  email_marketing: false,
  push_event_reminder_24h: true,
  push_event_reminder_1h: true,
  push_course_updates: true,
  inapp_event_registration: true,
  inapp_event_reminder_24h: true,
  inapp_event_reminder_1h: true,
  inapp_course_updates: true,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        // Create default preferences for new users
        const { data: newData, error: insertError } = await supabase
          .from("notification_preferences")
          .insert({ user_id: user.id, ...defaultPreferences })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newData as NotificationPreferences);
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updatePreference = useCallback(
    async (key: keyof Omit<NotificationPreferences, "id" | "user_id">, value: boolean) => {
      if (!preferences) return;

      setSaving(true);
      const previousValue = preferences[key];
      
      // Optimistic update
      setPreferences((prev) => (prev ? { ...prev, [key]: value } : null));

      try {
        const { error } = await supabase
          .from("notification_preferences")
          .update({ [key]: value })
          .eq("id", preferences.id);

        if (error) throw error;

        toast({
          title: "Preferences updated",
          description: "Your notification preferences have been saved.",
        });
      } catch (error) {
        console.error("Error updating preference:", error);
        // Rollback on error
        setPreferences((prev) => (prev ? { ...prev, [key]: previousValue } : null));
        toast({
          title: "Error",
          description: "Failed to update preferences. Please try again.",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [preferences, toast]
  );

  const updateMultiplePreferences = useCallback(
    async (updates: Partial<Omit<NotificationPreferences, "id" | "user_id">>) => {
      if (!preferences) return;

      setSaving(true);
      const previousPreferences = { ...preferences };
      
      // Optimistic update
      setPreferences((prev) => (prev ? { ...prev, ...updates } : null));

      try {
        const { error } = await supabase
          .from("notification_preferences")
          .update(updates)
          .eq("id", preferences.id);

        if (error) throw error;

        toast({
          title: "Preferences updated",
          description: "Your notification preferences have been saved.",
        });
      } catch (error) {
        console.error("Error updating preferences:", error);
        // Rollback on error
        setPreferences(previousPreferences);
        toast({
          title: "Error",
          description: "Failed to update preferences. Please try again.",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [preferences, toast]
  );

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    saving,
    updatePreference,
    updateMultiplePreferences,
    refetch: fetchPreferences,
  };
}
