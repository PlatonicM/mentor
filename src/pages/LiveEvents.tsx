import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  ArrowLeft,
  Loader2,
  List,
  CalendarDays,
  Filter,
  Users,
  User,
  ArrowUpDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useLiveEvents } from "@/hooks/use-live-events";
import { useAuth } from "@/contexts/AuthContext";
import { EventCard } from "@/components/events/EventCard";
import { EventCalendarView } from "@/components/events/EventCalendarView";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import {
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";

/* ================= TYPES ================= */

type EventTypeFilter = "all" | "webinar" | "one_on_one";
type DateRangeFilter =
  | "all"
  | "this_week"
  | "this_month"
  | "next_7_days"
  | "next_30_days";
type SortOption = "date_asc" | "date_desc" | "popularity";

/* ================= COMPONENT ================= */

export default function LiveEvents() {
  const { user } = useAuth();
  const { events, loading, registerForEvent, cancelRegistration } =
    useLiveEvents();

  const [registering, setRegistering] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [eventTypeFilter, setEventTypeFilter] =
    useState<EventTypeFilter>("all");
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DateRangeFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("date_asc");

  /* ================= FILTER + SORT ================= */

  const filteredEvents = useMemo(() => {
    const now = new Date();

    const filtered = events.filter((event) => {
      const eventDate = new Date(event.scheduled_at);

      // Only upcoming scheduled events
      if (
        event.status !== "scheduled" ||
        eventDate.getTime() < now.getTime()
      ) {
        return false;
      }

      if (
        eventTypeFilter !== "all" &&
        event.event_type !== eventTypeFilter
      ) {
        return false;
      }

      if (dateRangeFilter !== "all") {
        let start: Date;
        let end: Date;

        switch (dateRangeFilter) {
          case "this_week":
            start = startOfWeek(now, { weekStartsOn: 1 });
            end = endOfWeek(now, { weekStartsOn: 1 });
            break;
          case "this_month":
            start = startOfMonth(now);
            end = endOfMonth(now);
            break;
          case "next_7_days":
            start = now;
            end = addDays(now, 7);
            break;
          case "next_30_days":
            start = now;
            end = addDays(now, 30);
            break;
          default:
            return true;
        }

        if (!isWithinInterval(eventDate, { start, end })) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "date_desc":
          return (
            new Date(b.scheduled_at).getTime() -
            new Date(a.scheduled_at).getTime()
          );
        case "popularity":
          return (b.participant_count ?? 0) - (a.participant_count ?? 0);
        default:
          return (
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime()
          );
      }
    });
  }, [events, eventTypeFilter, dateRangeFilter, sortOption]);

  const myEvents = useMemo(
    () =>
      filteredEvents.filter(
        (e) => !!e.user_status && e.status === "scheduled"
      ),
    [filteredEvents]
  );

  const hasActiveFilters =
    eventTypeFilter !== "all" ||
    dateRangeFilter !== "all" ||
    sortOption !== "date_asc";

  const clearFilters = () => {
    setEventTypeFilter("all");
    setDateRangeFilter("all");
    setSortOption("date_asc");
  };

  /* ================= ACTIONS ================= */

  const handleRegister = async (eventId: string) => {
    try {
      setRegistering(eventId);
      await registerForEvent(eventId);
    } finally {
      setRegistering(null);
    }
  };

  const handleCancel = async (eventId: string) => {
    try {
      setRegistering(eventId);
      await cancelRegistration(eventId);
    } finally {
      setRegistering(null);
    }
  };

  const scrollToEvent = useCallback((eventId: string) => {
    const el = document.getElementById(`event-${eventId}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary");

    setTimeout(
      () => el.classList.remove("ring-2", "ring-primary"),
      2000
    );
  }, []);

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Live Events</h1>
                <p className="text-muted-foreground">
                  Join live sessions with mentors and fellow students
                </p>
              </div>
            </div>

            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) =>
                v && setViewMode(v as "list" | "calendar")
              }
              className="bg-muted rounded-lg p-1"
            >
              <ToggleGroupItem value="list">
                <List className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar">
                <CalendarDays className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-muted/50 rounded-lg">
          <Filter className="w-4 h-4 text-muted-foreground" />

          <Select
            value={eventTypeFilter}
            onValueChange={(v) =>
              setEventTypeFilter(v as EventTypeFilter)
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="webinar">
                <Users className="w-3 h-3 inline mr-2" /> Webinar
              </SelectItem>
              <SelectItem value="one_on_one">
                <User className="w-3 h-3 inline mr-2" /> 1-on-1
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={dateRangeFilter}
            onValueChange={(v) =>
              setDateRangeFilter(v as DateRangeFilter)
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="next_7_days">Next 7 Days</SelectItem>
              <SelectItem value="next_30_days">Next 30 Days</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 border-l pl-3">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <Select
              value={sortOption}
              onValueChange={(v) =>
                setSortOption(v as SortOption)
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_asc">Date (Earliest)</SelectItem>
                <SelectItem value="date_desc">Date (Latest)</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}

          <span className="ml-auto text-sm text-muted-foreground">
            {filteredEvents.length} event
            {filteredEvents.length !== 1 && "s"}
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : viewMode === "calendar" ? (
          <EventCalendarView
            events={filteredEvents}
            onEventClick={(id) => {
              setViewMode("list");
              setTimeout(() => scrollToEvent(id), 100);
            }}
          />
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({filteredEvents.length})
              </TabsTrigger>
              {user && (
                <TabsTrigger value="my-events">
                  My Events ({myEvents.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="upcoming">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event) => (
                  <div key={event.id} id={`event-${event.id}`}>
                    <EventCard
                      event={event}
                      onRegister={handleRegister}
                      onCancel={handleCancel}
                      isRegistering={registering === event.id}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            {user && (
              <TabsContent value="my-events">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {myEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onRegister={handleRegister}
                      onCancel={handleCancel}
                      isRegistering={registering === event.id}
                    />
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>

      <Footer />
    </div>
  );
}
