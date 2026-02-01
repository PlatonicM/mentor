import { format } from "date-fns";
import { Calendar, Clock, Users, Video, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LiveEvent } from "@/hooks/use-live-events";

interface EventCardProps {
  event: LiveEvent;
  onRegister?: (eventId: string) => void;
  onCancel?: (eventId: string) => void;
  isRegistering?: boolean;
}

export function EventCard({ event, onRegister, onCancel, isRegistering }: EventCardProps) {
  const eventDate = new Date(event.scheduled_at);
  const now = new Date();
  const isPast = eventDate < now;
  const isFull = event.max_participants && event.participant_count && event.participant_count >= event.max_participants;
  
  const timeUntilEvent = eventDate.getTime() - now.getTime();
  const isStartingSoon = !isPast && timeUntilEvent <= 60 * 60 * 1000; // Within 1 hour

  const getStatusBadge = () => {
    if (event.user_status === "accepted") {
      return <Badge className="bg-green-500">Confirmed</Badge>;
    }
    if (event.user_status === "pending") {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
    if (event.user_status === "declined") {
      return <Badge variant="destructive">Declined</Badge>;
    }
    return null;
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant={event.event_type === "one_on_one" ? "outline" : "default"}>
                {event.event_type === "one_on_one" ? (
                  <><User className="w-3 h-3 mr-1" /> 1-on-1</>
                ) : (
                  <><Users className="w-3 h-3 mr-1" /> Webinar</>
                )}
              </Badge>
              {isStartingSoon && (
                <Badge className="bg-orange-500 hover:bg-orange-600 animate-pulse">
                  <Clock className="w-3 h-3 mr-1" /> Starting Soon
                </Badge>
              )}
              {getStatusBadge()}
            </div>
            <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
          </div>
        </div>
        {event.course && (
          <p className="text-sm text-muted-foreground">
            Related to: {event.course.title}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(eventDate, "EEEE, MMMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{format(eventDate, "h:mm a")} ({event.duration_minutes} min)</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {event.participant_count || 0} registered
              {event.max_participants && ` / ${event.max_participants} max`}
            </span>
          </div>
        </div>

        {event.mentor && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Avatar className="w-8 h-8">
              <AvatarImage src={event.mentor.avatar_url || undefined} />
              <AvatarFallback>
                {event.mentor.full_name?.charAt(0) || "M"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{event.mentor.full_name || "Mentor"}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        {event.user_status === "accepted" && event.meeting_link ? (
          <Button asChild className="w-full">
            <a href={event.meeting_link} target="_blank" rel="noopener noreferrer">
              <Video className="w-4 h-4 mr-2" />
              Join Meeting
            </a>
          </Button>
        ) : event.user_status ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onCancel?.(event.id)}
            disabled={isRegistering}
          >
            Cancel Registration
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={() => onRegister?.(event.id)}
            disabled={isRegistering || isPast || !!isFull}
          >
            {isPast ? "Event Passed" : isFull ? "Event Full" : "Register"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
