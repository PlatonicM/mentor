import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Play, Clock, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface EnrolledCourseCardProps {
  enrollment: {
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
  };
  index: number;
  showContinue?: boolean;
}

export const EnrolledCourseCard = ({ enrollment, index, showContinue }: EnrolledCourseCardProps) => {
  const navigate = useNavigate();
  const { course, progress_percent, completed_at, enrolled_at } = enrollment;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getLevelColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case "beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-primary/20 text-primary border-primary/30";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      <Card variant="glass" className="overflow-hidden h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Play className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Progress Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-medium text-foreground">{progress_percent}%</span>
            </div>
            <Progress value={progress_percent} className="h-1.5" />
          </div>

          {/* Completed Badge */}
          {completed_at && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-green-500/90 text-white border-0">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Category & Level */}
          <div className="flex items-center gap-2 mb-3">
            {course.category && (
              <Badge variant="outline" className="text-xs">
                {course.category.name}
              </Badge>
            )}
            {course.level && (
              <Badge className={`text-xs ${getLevelColor(course.level)}`}>
                {course.level}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-display font-semibold text-foreground mb-3 line-clamp-2 flex-1">
            {course.title}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            {course.duration_hours && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{course.duration_hours}h</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Enrolled {formatDate(enrolled_at)}</span>
            </div>
          </div>

          {/* Action Button */}
          <Button
            className="w-full"
            variant={showContinue ? "default" : "outline"}
            onClick={() => navigate(`/course/${course.slug}`)}
          >
            <Play className="w-4 h-4 mr-2" />
            {completed_at ? "Review Course" : showContinue ? "Continue Learning" : "Go to Course"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
