import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Mail, Smartphone, MessageSquare, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface PreferenceToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function PreferenceToggle({ id, label, description, checked, onCheckedChange, disabled }: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-base font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { preferences, loading, saving, updatePreference } = useNotificationPreferences();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-3xl py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Notification Settings
          </h1>
          <p className="text-muted-foreground">
            Choose how and when you want to be notified about important updates.
          </p>
        </div>

        <div className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Receive updates directly in your inbox
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <PreferenceToggle
                id="email_event_registration"
                label="Event Registration"
                description="Receive confirmation emails when you register for events"
                checked={preferences.email_event_registration}
                onCheckedChange={(checked) => updatePreference("email_event_registration", checked)}
                disabled={saving}
              />
              <Separator />
              <PreferenceToggle
                id="email_event_reminder_24h"
                label="24-Hour Event Reminder"
                description="Get reminded 24 hours before your scheduled events"
                checked={preferences.email_event_reminder_24h}
                onCheckedChange={(checked) => updatePreference("email_event_reminder_24h", checked)}
                disabled={saving}
              />
              <Separator />
              <PreferenceToggle
                id="email_event_reminder_1h"
                label="1-Hour Event Reminder"
                description="Get reminded 1 hour before your scheduled events"
                checked={preferences.email_event_reminder_1h}
                onCheckedChange={(checked) => updatePreference("email_event_reminder_1h", checked)}
                disabled={saving}
              />
              <Separator />
              <PreferenceToggle
                id="email_course_updates"
                label="Course Updates"
                description="Get notified about updates to courses you're enrolled in"
                checked={preferences.email_course_updates}
                onCheckedChange={(checked) => updatePreference("email_course_updates", checked)}
                disabled={saving}
              />
              <Separator />
              <PreferenceToggle
                id="email_marketing"
                label="Marketing & Promotions"
                description="Receive news about new features, courses, and special offers"
                checked={preferences.email_marketing}
                onCheckedChange={(checked) => updatePreference("email_marketing", checked)}
                disabled={saving}
              />
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Push Notifications
              </CardTitle>
              <CardDescription>
                Receive browser push notifications for time-sensitive updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <PreferenceToggle
                id="push_event_reminder_24h"
                label="24-Hour Event Reminder"
                description="Get a push notification 24 hours before events"
                checked={preferences.push_event_reminder_24h}
                onCheckedChange={(checked) => updatePreference("push_event_reminder_24h", checked)}
                disabled={saving}
              />
              <Separator />
              <PreferenceToggle
                id="push_event_reminder_1h"
                label="1-Hour Event Reminder"
                description="Get a push notification 1 hour before events"
                checked={preferences.push_event_reminder_1h}
                onCheckedChange={(checked) => updatePreference("push_event_reminder_1h", checked)}
                disabled={saving}
              />
              <Separator />
              <PreferenceToggle
                id="push_course_updates"
                label="Course Updates"
                description="Get push notifications for course updates"
                checked={preferences.push_course_updates}
                onCheckedChange={(checked) => updatePreference("push_course_updates", checked)}
                disabled={saving}
              />
            </CardContent>
          </Card>

          {/* In-App Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                In-App Notifications
              </CardTitle>
              <CardDescription>
                Notifications shown within the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <PreferenceToggle
                id="inapp_event_registration"
                label="Event Registration"
                description="See notifications when you register for events"
                checked={preferences.inapp_event_registration}
                onCheckedChange={(checked) => updatePreference("inapp_event_registration", checked)}
                disabled={saving}
              />
              <Separator />
              <PreferenceToggle
                id="inapp_event_reminder_24h"
                label="24-Hour Event Reminder"
                description="Get an in-app reminder 24 hours before events"
                checked={preferences.inapp_event_reminder_24h}
                onCheckedChange={(checked) => updatePreference("inapp_event_reminder_24h", checked)}
                disabled={saving}
              />
              <Separator />
              <PreferenceToggle
                id="inapp_event_reminder_1h"
                label="1-Hour Event Reminder"
                description="Get an in-app reminder 1 hour before events"
                checked={preferences.inapp_event_reminder_1h}
                onCheckedChange={(checked) => updatePreference("inapp_event_reminder_1h", checked)}
                disabled={saving}
              />
              <Separator />
              <PreferenceToggle
                id="inapp_course_updates"
                label="Course Updates"
                description="See in-app notifications for course updates"
                checked={preferences.inapp_course_updates}
                onCheckedChange={(checked) => updatePreference("inapp_course_updates", checked)}
                disabled={saving}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
