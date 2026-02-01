import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Users, Video, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface Event {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  event_type: "one_on_one" | "webinar";
  status: string;
  max_participants: number | null;
  participant_count?: number;
  user_status?: string | null;
  mentor_name?: string;
}

interface EventCalendarViewProps {
  events: Event[];
  onEventClick?: (eventId: string) => void;
}

export function EventCalendarView({ events, onEventClick }: EventCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach((event) => {
      const dateKey = format(new Date(event.scheduled_at), "yyyy-MM-dd");
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, event]);
    });
    return map;
  }, [events]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get the first day of the month to calculate padding
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-medium text-muted-foreground bg-muted/20"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {/* Padding for days before the first of the month */}
        {paddingDays.map((_, index) => (
          <div
            key={`padding-${index}`}
            className="min-h-[100px] p-2 border-b border-r border-border bg-muted/10"
          />
        ))}

        {/* Actual days */}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(dateKey) || [];
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-[100px] p-2 border-b border-r border-border transition-colors",
                !isSameMonth(day, currentMonth) && "bg-muted/20",
                isToday && "bg-primary/5"
              )}
            >
              <div
                className={cn(
                  "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <HoverCard key={event.id} openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <button
                        onClick={() => onEventClick?.(event.id)}
                        className={cn(
                          "w-full text-left text-xs p-1.5 rounded truncate transition-colors",
                          event.event_type === "webinar"
                            ? "bg-primary/20 text-primary hover:bg-primary/30"
                            : "bg-secondary/20 text-secondary-foreground hover:bg-secondary/30",
                          event.user_status === "accepted" && "ring-1 ring-green-500"
                        )}
                      >
                        <span className="flex items-center gap-1">
                          {event.event_type === "webinar" ? (
                            <Users className="w-3 h-3 flex-shrink-0" />
                          ) : (
                            <User className="w-3 h-3 flex-shrink-0" />
                          )}
                          <span className="truncate">{event.title}</span>
                        </span>
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-72" side="right">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm">{event.title}</h4>
                          <Badge
                            variant={event.event_type === "webinar" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {event.event_type === "webinar" ? "Webinar" : "1-on-1"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(new Date(event.scheduled_at), "h:mm a")} • {event.duration_minutes} min
                          </span>
                        </div>

                        {event.mentor_name && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{event.mentor_name}</span>
                          </div>
                        )}

                        {event.event_type === "webinar" && event.max_participants && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>
                              {event.participant_count || 0} / {event.max_participants} spots
                            </span>
                          </div>
                        )}

                        {event.user_status && (
                          <Badge
                            variant={event.user_status === "accepted" ? "default" : "outline"}
                            className={cn(
                              "text-xs",
                              event.user_status === "accepted" && "bg-green-500/20 text-green-700 border-green-500"
                            )}
                          >
                            {event.user_status === "accepted" ? "Registered" : "Pending"}
                          </Badge>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}

                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-3 border-t border-border bg-muted/20 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary/20" />
          <span className="text-muted-foreground">Webinar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-secondary/20" />
          <span className="text-muted-foreground">1-on-1</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded ring-1 ring-green-500" />
          <span className="text-muted-foreground">Registered</span>
        </div>
      </div>
    </div>
  );
}
