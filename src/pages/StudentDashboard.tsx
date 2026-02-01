import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Award, TrendingUp, Play, Download, Calendar, Heart } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { EnrolledCourseCard } from "@/components/dashboard/EnrolledCourseCard";
import { CertificateCard } from "@/components/dashboard/CertificateCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { WishlistCourseCard } from "@/components/dashboard/WishlistCourseCard";
import { useWishlist } from "@/hooks/use-wishlist";

interface EnrolledCourse {
  id: string;
  course_id: string;
  progress_percent: number;
  enrolled_at: string;
  last_accessed_at: string;
  completed_at: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    duration_hours: number | null;
    level: string | null;
    category: {
      name: string;
    } | null;
  };
}

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  course: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  };
}

interface WishlistCourse {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  thumbnail_url: string | null;
  price: number | null;
  discounted_price: number | null;
  duration_hours: number | null;
  level: string | null;
  rating: number | null;
  total_reviews: number | null;
  total_students: number | null;
}

const StudentDashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [wishlistCourses, setWishlistCourses] = useState<WishlistCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const { wishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Fetch wishlist courses when wishlist changes
  useEffect(() => {
    const fetchWishlistCourses = async () => {
      if (wishlist.length === 0) {
        setWishlistCourses([]);
        return;
      }

      const courseIds = wishlist.map((item) => item.course_id);
      const { data } = await supabase
        .from("courses")
        .select("id, title, slug, short_description, thumbnail_url, price, discounted_price, duration_hours, level, rating, total_reviews, total_students")
        .in("id", courseIds)
        .eq("is_published", true);

      if (data) {
        setWishlistCourses(data);
      }
    };

    fetchWishlistCourses();
  }, [wishlist]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch enrolled courses
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select(`
          id,
          course_id,
          progress_percent,
          enrolled_at,
          last_accessed_at,
          completed_at,
          course:courses (
            id,
            title,
            slug,
            thumbnail_url,
            duration_hours,
            level,
            category:categories (name)
          )
        `)
        .eq("user_id", user.id)
        .order("last_accessed_at", { ascending: false });

      if (enrollments) {
        setEnrolledCourses(enrollments as unknown as EnrolledCourse[]);
      }

      // Fetch certificates
      const { data: certs } = await supabase
        .from("certificates")
        .select(`
          id,
          certificate_number,
          issued_at,
          course:courses (
            id,
            title,
            thumbnail_url
          )
        `)
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });

      if (certs) {
        setCertificates(certs as unknown as Certificate[]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalCourses: enrolledCourses.length,
    completedCourses: enrolledCourses.filter(e => e.completed_at).length,
    inProgressCourses: enrolledCourses.filter(e => !e.completed_at && e.progress_percent > 0).length,
    totalCertificates: certificates.length,
    avgProgress: enrolledCourses.length > 0 
      ? Math.round(enrolledCourses.reduce((acc, e) => acc + e.progress_percent, 0) / enrolledCourses.length)
      : 0,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Welcome back, {profile?.full_name || "Student"}!
            </h1>
            <p className="text-muted-foreground">
              Track your learning progress and continue where you left off.
            </p>
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
              label="Enrolled Courses"
              value={stats.totalCourses}
              color="primary"
            />
            <StatsCard
              icon={TrendingUp}
              label="In Progress"
              value={stats.inProgressCourses}
              color="accent"
            />
            <StatsCard
              icon={Award}
              label="Completed"
              value={stats.completedCourses}
              color="secondary"
            />
            <StatsCard
              icon={Award}
              label="Certificates"
              value={stats.totalCertificates}
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
              <TabsTrigger value="wishlist" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Heart className="w-4 h-4 mr-2" />
                Wishlist ({wishlistCourses.length})
              </TabsTrigger>
              <TabsTrigger value="certificates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Award className="w-4 h-4 mr-2" />
                Certificates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-6">
              {/* Continue Learning Section */}
              {enrolledCourses.filter(e => !e.completed_at && e.progress_percent > 0).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                    Continue Learning
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledCourses
                      .filter(e => !e.completed_at && e.progress_percent > 0)
                      .slice(0, 3)
                      .map((enrollment, index) => (
                        <EnrolledCourseCard
                          key={enrollment.id}
                          enrollment={enrollment}
                          index={index}
                          showContinue
                        />
                      ))}
                  </div>
                </motion.div>
              )}

              {/* All Enrolled Courses */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  All Enrolled Courses
                </h2>
                {enrolledCourses.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledCourses.map((enrollment, index) => (
                      <EnrolledCourseCard
                        key={enrollment.id}
                        enrollment={enrollment}
                        index={index}
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
                      Start your learning journey by enrolling in a course.
                    </p>
                    <Button onClick={() => navigate("/courses")}>
                      Browse Courses
                    </Button>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="wishlist" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Saved for Later
                </h2>
                {wishlistCourses.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistCourses.map((course, index) => (
                      <WishlistCourseCard
                        key={course.id}
                        course={course}
                        index={index}
                        onRemove={() => removeFromWishlist(course.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card variant="glass" className="p-12 text-center">
                    <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      No saved courses
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Save courses to your wishlist to access them later.
                    </p>
                    <Button onClick={() => navigate("/courses")}>
                      Browse Courses
                    </Button>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="certificates" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Your Certificates
                </h2>
                {certificates.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((certificate, index) => (
                      <CertificateCard
                        key={certificate.id}
                        certificate={certificate}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <Card variant="glass" className="p-12 text-center">
                    <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      No certificates yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Complete a course to earn your first certificate.
                    </p>
                    <Button onClick={() => navigate("/courses")}>
                      Start Learning
                    </Button>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudentDashboard;
