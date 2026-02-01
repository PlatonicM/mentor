import { useState, useEffect } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import {
  GripVertical,
  Plus,
  Edit,
  Trash2,
  Clock,
  Video,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LessonFormDialog } from "./LessonFormDialog";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  is_free: boolean;
  order_index: number;
}

interface LessonManagementProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
}

export const LessonManagement = ({
  open,
  onClose,
  courseId,
  courseTitle,
}: LessonManagementProps) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    if (open && courseId) {
      fetchLessons();
    }
  }, [open, courseId]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      toast({
        title: "Error",
        description: "Failed to load lessons.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (newOrder: Lesson[]) => {
    setLessons(newOrder);
  };

  const saveNewOrder = async () => {
    setIsSavingOrder(true);
    try {
      const updates = lessons.map((lesson, index) => ({
        id: lesson.id,
        order_index: index,
        course_id: courseId,
        title: lesson.title,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("lessons")
          .update({ order_index: update.order_index })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast({
        title: "Order Saved",
        description: "Lesson order has been updated.",
      });
    } catch (error) {
      console.error("Error saving order:", error);
      toast({
        title: "Error",
        description: "Failed to save lesson order.",
        variant: "destructive",
      });
      fetchLessons();
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      setLessons(lessons.filter((l) => l.id !== lessonId));
      toast({
        title: "Lesson Deleted",
        description: "The lesson has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast({
        title: "Error",
        description: "Failed to delete lesson.",
        variant: "destructive",
      });
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingLesson(null);
  };

  const handleFormSuccess = () => {
    fetchLessons();
    handleFormClose();
  };

  const totalDuration = lessons.reduce(
    (acc, l) => acc + (l.duration_minutes || 0),
    0
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] glass-strong border-border/50 p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="font-display text-xl mb-1">
                  Manage Lessons
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{courseTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {lessons.length} lessons
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {totalDuration} min
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 pt-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Drag lessons to reorder them
              </p>
              <div className="flex gap-2">
                {lessons.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveNewOrder}
                    disabled={isSavingOrder}
                  >
                    {isSavingOrder ? "Saving..." : "Save Order"}
                  </Button>
                )}
                <Button size="sm" onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lesson
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-lg bg-muted/30 animate-pulse"
                  />
                ))}
              </div>
            ) : lessons.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <Reorder.Group
                  axis="y"
                  values={lessons}
                  onReorder={handleReorder}
                  className="space-y-2"
                >
                  {lessons.map((lesson, index) => (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      index={index}
                      onEdit={() => handleEditLesson(lesson)}
                      onDelete={() => handleDeleteLesson(lesson.id)}
                    />
                  ))}
                </Reorder.Group>
              </ScrollArea>
            ) : (
              <div className="text-center py-12">
                <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  No lessons yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first lesson to start building your course.
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Lesson
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <LessonFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        courseId={courseId}
        editLesson={editingLesson}
        nextOrderIndex={lessons.length}
      />
    </>
  );
};

interface LessonItemProps {
  lesson: Lesson;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

const LessonItem = ({ lesson, index, onEdit, onDelete }: LessonItemProps) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={lesson}
      dragListener={false}
      dragControls={dragControls}
      className="bg-muted/30 rounded-lg border border-border/50 p-4 cursor-default"
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Lesson Number */}
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-primary">{index + 1}</span>
        </div>

        {/* Lesson Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">
              {lesson.title}
            </h4>
            {lesson.is_free && (
              <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Free
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {lesson.duration_minutes && lesson.duration_minutes > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lesson.duration_minutes} min
              </span>
            )}
            {lesson.video_url ? (
              <span className="flex items-center gap-1 text-success">
                <Video className="w-3 h-3" />
                Video added
              </span>
            ) : (
              <span className="flex items-center gap-1 text-warning">
                <Video className="w-3 h-3" />
                No video
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 hover:bg-muted/50"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Lesson?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  lesson and all associated progress data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Reorder.Item>
  );
};
