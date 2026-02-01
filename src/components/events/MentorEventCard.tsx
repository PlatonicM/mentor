import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Users, Video, MoreVertical, Trash2, Edit, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LiveEvent } from "@/hooks/use-live-events";

interface MentorEventCardProps {
  event: LiveEvent;
  onEdit: (event: LiveEvent) => void;
  onDelete: (eventId: string) => void;
  onViewParticipants: (event: LiveEvent) => void;
}

export function MentorEventCard({ event, onEdit, onDelete, onViewParticipants }: MentorEventCardProps) {
  const [deleting, setDeleting] = useState(false);
  const eventDate = new Date(event.scheduled_at);
  const isPast = eventDate < new Date();

  const getStatusColor = () => {
    switch (event.status) {
      case "live":
        return "bg-green-500";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(event.id);
    setDeleting(false);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={event.event_type === "one_on_one" ? "outline" : "default"}>
                {event.event_type === "one_on_one" ? (
                  <><User className="w-3 h-3 mr-1" /> 1-on-1</>
                ) : (
                  <><Users className="w-3 h-3 mr-1" /> Webinar</>
                )}
              </Badge>
              <Badge className={getStatusColor()}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(event)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          {event.meeting_link && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Video className="w-4 h-4" />
              <a
                href={event.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                Meeting Link
              </a>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onViewParticipants(event)}
        >
          <Users className="w-4 h-4 mr-2" />
          View Participants
        </Button>
      </CardFooter>
    </Card>
  );
}
