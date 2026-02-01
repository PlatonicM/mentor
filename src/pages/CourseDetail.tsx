import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Clock,
  Users,
  Star,
  ChevronLeft,
  BookOpen,
  Award,
  Lock,
  CheckCircle,
  ChevronRight,
  ShoppingCart,
  CreditCard,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { LessonList } from "@/components/course/LessonList";
import { CourseOverview } from "@/components/course/CourseOverview";
import { useWishlist } from "@/hooks/use-wishlist";
import { WishlistButton } from "@/components/WishlistButton";
import { ShareButtons } from "@/components/ShareButtons";
import { useCart } from "@/contexts/CartContext";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  preview_video_url: string | null;
  duration_hours: number | null;
  level: string | null;
  language: string | null;
  rating: number | null;
  total_reviews: number | null;
  total_students: number | null;
  price: number | null;
  discounted_price: number | null;
  mentor_id: string;
  category: {
    name: string;
  } | null;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  order_index: number;
  video_url: string | null;
  is_free: boolean;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
  watch_time_seconds: number | null;
}

interface Enrollment {
  id: string;
  progress_percent: number;
  completed_at: string | null;
}

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart, isInCart } = useCart();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showOverview, setShowOverview] = useState(true);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchCourseData();
    }
  }, [slug, user]);

  const fetchCourseData = async () => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select(`
          *,
          category:categories(name)
        `)
        .eq("slug", slug)
        .maybeSingle();

      if (courseError) throw courseError;
      if (!courseData) {
        navigate("/404");
        return;
      }

      setCourse(courseData as Course);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseData.id)
        .order("order_index");

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // If user is logged in, check enrollment and progress
      if (user) {
        const { data: enrollmentData } = await supabase
          .from("enrollments")
          .select("*")
          .eq("course_id", courseData.id)
          .eq("user_id", user.id)
          .maybeSingle();

        setEnrollment(enrollmentData);

        if (enrollmentData) {
          const { data: progressData } = await supabase
            .from("lesson_progress")
            .select("lesson_id, completed, watch_time_seconds")
            .eq("course_id", courseData.id)
            .eq("user_id", user.id);

          setLessonProgress(progressData || []);

          // Find first incomplete lesson or default to first
          const firstIncomplete = lessonsData?.find((lesson: Lesson) => {
            const progress = progressData?.find((p: LessonProgress) => p.lesson_id === lesson.id);
            return !progress?.completed;
          });

          if (firstIncomplete) {
            setCurrentLesson(firstIncomplete);
            setShowOverview(false);
          } else if (lessonsData?.length > 0) {
            setCurrentLesson(lessonsData[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!course) return;
    
    addToCart({
      course_id: course.id,
      title: course.title,
      slug: course.slug,
      thumbnail_url: course.thumbnail_url,
      price: course.price || 0,
      discounted_price: course.discounted_price,
      mentor_id: course.mentor_id,
    });
  };

  const handleEnrollClick = () => {
    if (!user) {
      navigate("/auth", { state: { from: `/course/${slug}` } });
      return;
    }

    const price = course?.discounted_price ?? course?.price ?? 0;
    if (price > 0) {
      // For paid courses, add to cart
      handleAddToCart();
      navigate("/cart");
    } else {
      // For free courses, enroll directly
      handleEnroll();
    }
  };

  const handleEnroll = async () => {
    if (!user || !course) return;

    setEnrolling(true);
    try {
      const price = course.discounted_price ?? course.price ?? 0;

      // Create enrollment
      const { data, error } = await supabase
        .from("enrollments")
        .insert({
          course_id: course.id,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // If paid course, create transaction record
      if (price > 0) {
        const platformFee = price * 0.2; // 20% platform fee
        const netAmount = price - platformFee;

        await supabase.from("transactions").insert({
          course_id: course.id,
          student_id: user.id,
          mentor_id: course.mentor_id,
          amount: price,
          platform_fee: platformFee,
          net_amount: netAmount,
          status: "completed",
        });
      }

      setEnrollment(data);
      setShowOverview(false);
      setShowPurchaseDialog(false);
      if (lessons.length > 0) {
        setCurrentLesson(lessons[0]);
      }

      toast({
        title: price > 0 ? "Purchase Complete!" : "Enrolled Successfully!",
        description: "You can now access all course content",
      });
    } catch (error) {
      console.error("Error enrolling:", error);
      toast({
        title: "Enrollment Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleLessonComplete = async (lessonId: string) => {
    if (!user || !course || !enrollment) return;

    try {
      const existingProgress = lessonProgress.find((p) => p.lesson_id === lessonId);

      if (existingProgress) {
        await supabase
          .from("lesson_progress")
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId);
      } else {
        await supabase.from("lesson_progress").insert({
          user_id: user.id,
          lesson_id: lessonId,
          course_id: course.id,
          completed: true,
          completed_at: new Date().toISOString(),
        });
      }

      // Update local state
      setLessonProgress((prev) => {
        const existing = prev.find((p) => p.lesson_id === lessonId);
        if (existing) {
          return prev.map((p) =>
            p.lesson_id === lessonId ? { ...p, completed: true } : p
          );
        }
        return [...prev, { lesson_id: lessonId, completed: true, watch_time_seconds: 0 }];
      });

      // Calculate new progress
      const completedCount = lessonProgress.filter((p) => p.completed).length + 1;
      const newProgress = Math.round((completedCount / lessons.length) * 100);

      // Update enrollment progress
      await supabase
        .from("enrollments")
        .update({
          progress_percent: newProgress,
          last_accessed_at: new Date().toISOString(),
          completed_at: newProgress === 100 ? new Date().toISOString() : null,
        })
        .eq("id", enrollment.id);

      setEnrollment((prev) =>
        prev ? { ...prev, progress_percent: newProgress } : null
      );

      toast({
        title: "Lesson Completed!",
        description: `Progress: ${newProgress}%`,
      });
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleNextLesson = () => {
    if (!currentLesson) return;
    const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id);
    if (currentIndex < lessons.length - 1) {
      setCurrentLesson(lessons[currentIndex + 1]);
    }
  };

  const handlePrevLesson = () => {
    if (!currentLesson) return;
    const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id);
    if (currentIndex > 0) {
      setCurrentLesson(lessons[currentIndex - 1]);
    }
  };

  const isLessonAccessible = (lesson: Lesson): boolean => {
    return !!enrollment || lesson.is_free;
  };

  const isLessonCompleted = (lessonId: string) => {
    return lessonProgress.find((p) => p.lesson_id === lessonId)?.completed || false;
  };

  if (loading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return null;
  }

  const completedLessons = lessonProgress.filter((p) => p.completed).length;
  const progressPercent = lessons.length > 0 
    ? Math.round((completedLessons / lessons.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-muted"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display font-semibold text-foreground line-clamp-1">
                {course.title}
              </h1>
              {enrollment && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Progress value={progressPercent} className="w-24 h-1.5" />
                  <span>{progressPercent}% complete</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShareButtons title={course.title} />
            <WishlistButton
              isWishlisted={course ? isInWishlist(course.id) : false}
              onToggle={() => course && toggleWishlist(course.id)}
              variant="outline"
              showLabel
            />
            {!enrollment && (
              <>
                {(course.price ?? 0) > 0 && isInCart(course.id) ? (
                  <Button variant="outline" onClick={() => navigate("/cart")}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    View Cart
                  </Button>
                ) : (
                  <Button onClick={handleEnrollClick} disabled={enrolling}>
                    {enrolling ? "Processing..." : (course.price ?? 0) === 0 ? "Enroll Free" : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart - ₹{course.discounted_price || course.price}
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {showOverview ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-auto"
              >
                <CourseOverview
                  course={course}
                  lessons={lessons}
                  enrollment={enrollment}
                  onEnroll={handleEnrollClick}
                  enrolling={enrolling}
                  onStartLearning={() => {
                    if (lessons.length > 0) {
                      setCurrentLesson(lessons[0]);
                      setShowOverview(false);
                    }
                  }}
                />
              </motion.div>
            ) : currentLesson ? (
              <motion.div
                key="lesson"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Video Player */}
                <div className="aspect-video bg-muted/50 relative">
                  <VideoPlayer
                    lesson={currentLesson}
                    isAccessible={isLessonAccessible(currentLesson)}
                    onComplete={() => handleLessonComplete(currentLesson.id)}
                  />
                </div>

                {/* Lesson Info & Controls */}
                <div className="p-6 border-b border-border/50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Lesson {lessons.findIndex((l) => l.id === currentLesson.id) + 1} of {lessons.length}
                        </Badge>
                        {isLessonCompleted(currentLesson.id) && (
                          <Badge className="bg-success/20 text-success border-success/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                        {currentLesson.title}
                      </h2>
                      {currentLesson.description && (
                        <p className="text-muted-foreground text-sm">
                          {currentLesson.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrevLesson}
                        disabled={lessons.findIndex((l) => l.id === currentLesson.id) === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextLesson}
                        disabled={lessons.findIndex((l) => l.id === currentLesson.id) === lessons.length - 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      {!isLessonCompleted(currentLesson.id) && enrollment && (
                        <Button
                          variant="secondary"
                          onClick={() => handleLessonComplete(currentLesson.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Lesson Sidebar */}
        <div className="w-80 border-l border-border/50 bg-card/30 flex flex-col">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-foreground">
                Course Content
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOverview(true)}
                className="text-xs"
              >
                Overview
              </Button>
            </div>
            {enrollment && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>{completedLessons} of {lessons.length} lessons completed</span>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            <LessonList
              lessons={lessons}
              currentLessonId={currentLesson?.id}
              lessonProgress={lessonProgress}
              isEnrolled={!!enrollment}
              onSelectLesson={(lesson) => {
                if (isLessonAccessible(lesson)) {
                  setCurrentLesson(lesson);
                  setShowOverview(false);
                } else {
                  toast({
                    title: "Lesson Locked",
                    description: "Enroll in the course to access this lesson",
                    variant: "destructive",
                  });
                }
              }}
            />
          </ScrollArea>
        </div>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Complete Your Purchase
            </DialogTitle>
            <DialogDescription>
              You're about to enroll in this course
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
              {course?.thumbnail_url ? (
                <img 
                  src={course.thumbnail_url} 
                  alt={course.title} 
                  className="w-20 h-14 object-cover rounded-lg"
                />
              ) : (
                <div className="w-20 h-14 bg-muted rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground line-clamp-2">{course?.title}</h4>
                <p className="text-sm text-muted-foreground">{lessons.length} lessons</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Course Price</span>
                <span className="text-foreground">
                  ${course?.price?.toFixed(2) || "0.00"}
                </span>
              </div>
              {course?.discounted_price && course?.price && course.discounted_price < course.price && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-400">
                    -${(course.price - course.discounted_price).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-medium pt-2 border-t border-border/50">
                <span className="text-foreground">Total</span>
                <span className="text-primary text-lg">
                  ${(course?.discounted_price ?? course?.price ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? (
                "Processing..."
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Confirm Purchase
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="glass-strong sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-48 h-6" />
        </div>
      </header>
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="flex-1 p-6">
          <Skeleton className="aspect-video w-full rounded-xl mb-6" />
          <Skeleton className="w-64 h-8 mb-4" />
          <Skeleton className="w-full h-20" />
        </div>
        <div className="w-80 border-l border-border/50 p-4">
          <Skeleton className="w-full h-8 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="w-full h-16 mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
