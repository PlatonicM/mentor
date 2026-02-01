import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  Award,
  Globe,
  BarChart3,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseReviews } from "./CourseReviews";
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

interface Enrollment {
  id: string;
  progress_percent: number;
  completed_at: string | null;
}

interface CourseOverviewProps {
  course: Course;
  lessons: Lesson[];
  enrollment: Enrollment | null;
  onEnroll: () => void;
  enrolling: boolean;
  onStartLearning: () => void;
}

export const CourseOverview = ({
  course,
  lessons,
  enrollment,
  onEnroll,
  enrolling,
  onStartLearning,
}: CourseOverviewProps) => {
  const navigate = useNavigate();
  const { isInCart } = useCart();
  const inCart = isInCart(course.id);
  const getLevelColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case "beginner":
        return "bg-success/20 text-success border-success/30";
      case "intermediate":
        return "bg-warning/20 text-warning border-warning/30";
      case "advanced":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-primary/20 text-primary border-primary/30";
    }
  };

  const totalDuration = lessons.reduce(
    (acc, lesson) => acc + (lesson.duration_minutes || 0),
    0
  );

  const freeLessons = lessons.filter((l) => l.is_free).length;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-8"
        >
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full aspect-video object-cover"
            />
          ) : (
            <div className="w-full aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Play className="w-20 h-20 text-muted-foreground" />
            </div>
          )}

          {/* Play Preview Button */}
          {course.preview_video_url && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Button
                size="lg"
                className="w-20 h-20 rounded-full bg-primary/90 hover:bg-primary hover:scale-110 transition-transform"
              >
                <Play className="w-8 h-8 fill-primary-foreground" />
              </Button>
            </div>
          )}

          {/* Category Badge */}
          {course.category && (
            <div className="absolute top-4 left-4">
              <Badge className="glass text-foreground border-border/50">
                {course.category.name}
              </Badge>
            </div>
          )}
        </motion.div>

        {/* Course Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid lg:grid-cols-3 gap-8"
        >
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {course.level && (
                  <Badge className={getLevelColor(course.level)}>
                    {course.level}
                  </Badge>
                )}
                {course.rating && course.rating > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="font-medium text-foreground">
                      {course.rating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({course.total_reviews} reviews)
                    </span>
                  </div>
                )}
              </div>

              <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
                {course.title}
              </h1>

              {course.short_description && (
                <p className="text-lg text-muted-foreground">
                  {course.short_description}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 py-4 border-y border-border/50">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">
                  {course.total_students || 0} students
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">
                  {course.duration_hours || Math.round(totalDuration / 60)}h total
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">
                  {lessons.length} lessons
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">
                  {course.language || "English"}
                </span>
              </div>
            </div>

            {/* Description */}
            {course.description && (
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  About This Course
                </h2>
                <div className="prose prose-invert prose-sm max-w-none text-muted-foreground">
                  <p>{course.description}</p>
                </div>
              </div>
            )}

            {/* What You'll Learn */}
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                What You'll Learn
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {lessons.slice(0, 6).map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BarChart3 className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground/90">
                      {lesson.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="pt-6 border-t border-border/50">
              <CourseReviews courseId={course.id} isEnrolled={!!enrollment} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 glass rounded-xl p-6 border border-border/50"
            >
              {/* Price */}
              {!enrollment && (
                <div className="mb-6">
                  {course.discounted_price && course.price && course.discounted_price < course.price ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display font-bold text-foreground">
                        ${course.discounted_price}
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        ${course.price}
                      </span>
                    </div>
                  ) : course.price === 0 ? (
                    <span className="text-3xl font-display font-bold text-success">
                      Free
                    </span>
                  ) : (
                    <span className="text-3xl font-display font-bold text-foreground">
                      ${course.price || 0}
                    </span>
                  )}
                </div>
              )}

              {/* CTA Button */}
              {enrollment ? (
                <Button
                  size="lg"
                  className="w-full btn-cta mb-4"
                  onClick={onStartLearning}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {enrollment.progress_percent > 0 ? "Continue Learning" : "Start Learning"}
                </Button>
              ) : inCart && course.price !== 0 && course.price !== null ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full mb-4"
                  onClick={() => navigate("/cart")}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Cart
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full btn-cta mb-4"
                  onClick={onEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? "Processing..." : (
                    course.price === 0 || course.price === null ? (
                      "Enroll for Free"
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart - ₹{course.discounted_price || course.price}
                      </>
                    )
                  )}
                </Button>
              )}

              {/* Course Includes */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <h4 className="text-sm font-medium text-foreground">
                  This course includes:
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Play className="w-4 h-4 text-primary" />
                    {lessons.length} on-demand video lessons
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    {Math.round(totalDuration / 60)}+ hours of content
                  </li>
                  {freeLessons > 0 && (
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4 text-primary" />
                      {freeLessons} free preview lessons
                    </li>
                  )}
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="w-4 h-4 text-primary" />
                    Certificate of completion
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
