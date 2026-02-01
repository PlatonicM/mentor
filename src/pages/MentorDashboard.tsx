import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, Users, DollarSign, TrendingUp, Plus, 
  BarChart3, Eye, Edit, Trash2, Calendar
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { MentorCourseCard } from "@/components/dashboard/MentorCourseCard";
import { CourseFormDialog } from "@/components/dashboard/CourseFormDialog";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { StudentAnalytics } from "@/components/dashboard/StudentAnalytics";
import { LessonManagement } from "@/components/dashboard/LessonManagement";
import { toast } from "@/hooks/use-toast";
import { useMentorEvents, LiveEvent } from "@/hooks/use-live-events";
import { MentorEventCard } from "@/components/events/MentorEventCard";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { ParticipantsDialog } from "@/components/events/ParticipantsDialog";

interface MentorCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  price: number | null;
  discounted_price: number | null;
  is_published: boolean | null;
  total_students: number | null;
  total_reviews: number | null;
  rating: number | null;
  created_at: string;
  category: { name: string } | null;
}

interface Transaction {
  id: string;
  amount: number;
  net_amount: number;
  created_at: string;
  course: { title: string } | null;
}

const MentorDashboard = () => {
  const { user, profile, roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<MentorCourse[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<MentorCourse | null>(null);
  const [lessonManagementCourse, setLessonManagementCourse] = useState<MentorCourse | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LiveEvent | null>(null);
  const [participantsEvent, setParticipantsEvent] = useState<LiveEvent | null>(null);
  
  const { events, createEvent, updateEvent, deleteEvent, getParticipants, updateParticipantStatus } = useMentorEvents();

  const isMentor = roles.includes("mentor") || roles.includes("admin");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading && user && !isMentor) {
      navigate("/dashboard");
      toast({
        title: "Access Denied",
        description: "You need to be a mentor to access this page.",
        variant: "destructive",
      });
    }
  }, [user, authLoading, isMentor, navigate]);

  useEffect(() => {
    if (user && isMentor) {
      fetchDashboardData();
    }
  }, [user, isMentor]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch mentor's courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select(`
          id, title, slug, thumbnail_url, price, discounted_price,
          is_published, total_students, total_reviews, rating, created_at,
          category:categories (name)
        `)
        .eq("mentor_id", user.id)
        .order("created_at", { ascending: false });

      if (coursesData) {
        setCourses(coursesData as unknown as MentorCourse[]);
      }

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select(`
          id, amount, net_amount, created_at,
          course:courses (title)
        `)
        .eq("mentor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (transactionsData) {
        setTransactions(transactionsData as unknown as Transaction[]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;

      setCourses(courses.filter(c => c.id !== courseId));
      toast({
        title: "Course Deleted",
        description: "The course has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: "Failed to delete course.",
        variant: "destructive",
      });
    }
  };

  const handleEditCourse = (course: MentorCourse) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCourse(null);
  };

  const handleFormSuccess = () => {
    fetchDashboardData();
    handleFormClose();
  };

  // Calculate stats
  const stats = {
    totalCourses: courses.length,
    publishedCourses: courses.filter(c => c.is_published).length,
    totalStudents: courses.reduce((acc, c) => acc + (c.total_students || 0), 0),
    totalEarnings: transactions.reduce((acc, t) => acc + t.net_amount, 0),
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!isMentor) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
          >
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Mentor Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your courses, track students, and monitor earnings.
              </p>
            </div>
            <Button
              className="mt-4 md:mt-0"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <StatsCard
              icon={BookOpen}
              label="Total Courses"
              value={stats.totalCourses}
              color="primary"
            />
            <StatsCard
              icon={Eye}
              label="Published"
              value={stats.publishedCourses}
              color="accent"
            />
            <StatsCard
              icon={Users}
              label="Total Students"
              value={stats.totalStudents}
              color="secondary"
            />
            <StatsCard
              icon={DollarSign}
              label="Total Earnings"
              value={stats.totalEarnings}
              color="primary"
            />
          </motion.div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="courses" className="space-y-6">
            <TabsList className="bg-card/50 border border-border">
              <TabsTrigger value="courses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BookOpen className="w-4 h-4 mr-2" />
                My Courses
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="earnings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <DollarSign className="w-4 h-4 mr-2" />
                Earnings
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                Live Events
              </TabsTrigger>
            </TabsList>

            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {courses.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course, index) => (
                      <MentorCourseCard
                        key={course.id}
                        course={course}
                        index={index}
                        onEdit={() => handleEditCourse(course)}
                        onDelete={() => handleDeleteCourse(course.id)}
                        onManageLessons={() => setLessonManagementCourse(course)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card variant="glass" className="p-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      No courses yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first course to start teaching.
                    </p>
                    <Button onClick={() => setIsFormOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Course
                    </Button>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <StudentAnalytics courses={courses} />
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings" className="space-y-6">
              <EarningsChart transactions={transactions} />
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={() => setIsEventFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>
              {events.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <MentorEventCard
                      key={event.id}
                      event={event}
                      onEdit={(e) => { setEditingEvent(e); setIsEventFormOpen(true); }}
                      onDelete={deleteEvent}
                      onViewParticipants={setParticipantsEvent}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No events yet</h3>
                  <p className="text-muted-foreground mb-6">Create your first live event.</p>
                  <Button onClick={() => setIsEventFormOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Course Form Dialog */}
      <CourseFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        editCourse={editingCourse}
      />

      {/* Lesson Management Dialog */}
      {lessonManagementCourse && (
        <LessonManagement
          open={!!lessonManagementCourse}
          onClose={() => setLessonManagementCourse(null)}
          courseId={lessonManagementCourse.id}
          courseTitle={lessonManagementCourse.title}
        />
      )}

      {/* Event Form Dialog */}
      <CreateEventDialog
        open={isEventFormOpen}
        onOpenChange={(open) => { setIsEventFormOpen(open); if (!open) setEditingEvent(null); }}
        onSubmit={editingEvent ? (data) => updateEvent(editingEvent.id, data) : createEvent}
        initialData={editingEvent}
      />

      {/* Participants Dialog */}
      {participantsEvent && (
        <ParticipantsDialog
          open={!!participantsEvent}
          onOpenChange={(open) => !open && setParticipantsEvent(null)}
          eventId={participantsEvent.id}
          eventTitle={participantsEvent.title}
          getParticipants={getParticipants}
          onUpdateStatus={updateParticipantStatus}
        />
      )}
    </div>
  );
};

export default MentorDashboard;
