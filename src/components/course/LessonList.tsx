import { motion } from "framer-motion";
import { Play, Lock, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface LessonListProps {
  lessons: Lesson[];
  currentLessonId?: string;
  lessonProgress: LessonProgress[];
  isEnrolled: boolean;
  onSelectLesson: (lesson: Lesson) => void;
}

export const LessonList = ({
  lessons,
  currentLessonId,
  lessonProgress,
  isEnrolled,
  onSelectLesson,
}: LessonListProps) => {
  const isLessonCompleted = (lessonId: string) => {
    return lessonProgress.find((p) => p.lesson_id === lessonId)?.completed || false;
  };

  const isLessonAccessible = (lesson: Lesson) => {
    return isEnrolled || lesson.is_free;
  };

  return (
    <div className="p-2">
      {lessons.map((lesson, index) => {
        const isActive = currentLessonId === lesson.id;
        const isCompleted = isLessonCompleted(lesson.id);
        const isAccessible = isLessonAccessible(lesson);

        return (
          <motion.button
            key={lesson.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectLesson(lesson)}
            className={cn(
              "w-full text-left p-3 rounded-lg mb-1 transition-all duration-200",
              "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring",
              isActive && "bg-primary/10 border border-primary/30",
              !isAccessible && "opacity-60 cursor-not-allowed"
            )}
          >
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  isCompleted && "bg-success/20",
                  isActive && !isCompleted && "bg-primary/20",
                  !isActive && !isCompleted && "bg-muted"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : !isAccessible ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : isActive ? (
                  <Play className="w-4 h-4 text-primary fill-primary" />
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Lesson Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4
                    className={cn(
                      "text-sm font-medium truncate",
                      isActive ? "text-foreground" : "text-foreground/80"
                    )}
                  >
                    {lesson.title}
                  </h4>
                  {lesson.is_free && !isEnrolled && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary/20 text-secondary">
                      FREE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {lesson.duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lesson.duration_minutes} min
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}

      {lessons.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No lessons available yet</p>
        </div>
      )}
    </div>
  );
};
