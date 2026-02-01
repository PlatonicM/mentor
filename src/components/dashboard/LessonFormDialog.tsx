import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const lessonSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().max(1000, "Description must be less than 1000 characters").optional(),
  video_url: z.string().trim().url("Invalid URL").max(500, "URL must be less than 500 characters").optional().or(z.literal("")),
  duration_minutes: z.coerce.number().min(0, "Duration must be positive").max(600, "Duration cannot exceed 10 hours").optional(),
  is_free: z.boolean().default(false),
});

type LessonFormValues = z.infer<typeof lessonSchema>;

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  is_free: boolean;
  order_index: number;
}

interface LessonFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId: string;
  editLesson?: Lesson | null;
  nextOrderIndex: number;
}

export const LessonFormDialog = ({
  open,
  onClose,
  onSuccess,
  courseId,
  editLesson,
  nextOrderIndex,
}: LessonFormDialogProps) => {
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      description: "",
      video_url: "",
      duration_minutes: 0,
      is_free: false,
    },
  });

  useEffect(() => {
    if (editLesson) {
      form.reset({
        title: editLesson.title,
        description: editLesson.description || "",
        video_url: editLesson.video_url || "",
        duration_minutes: editLesson.duration_minutes || 0,
        is_free: editLesson.is_free,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        video_url: "",
        duration_minutes: 0,
        is_free: false,
      });
    }
  }, [editLesson, form]);

  const onSubmit = async (values: LessonFormValues) => {
    try {
      const lessonData = {
        title: values.title,
        description: values.description || null,
        video_url: values.video_url || null,
        duration_minutes: values.duration_minutes || 0,
        is_free: values.is_free,
        course_id: courseId,
      };

      if (editLesson) {
        const { error } = await supabase
          .from("lessons")
          .update(lessonData)
          .eq("id", editLesson.id);

        if (error) throw error;

        toast({
          title: "Lesson Updated",
          description: "Your lesson has been updated successfully.",
        });
      } else {
        const { error } = await supabase.from("lessons").insert({
          ...lessonData,
          order_index: nextOrderIndex,
        });

        if (error) throw error;

        toast({
          title: "Lesson Created",
          description: "Your new lesson has been created successfully.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast({
        title: "Error",
        description: "Failed to save lesson. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glass-strong border-border/50">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {editLesson ? "Edit Lesson" : "Add New Lesson"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Introduction to React Hooks"
                      {...field}
                      className="bg-muted/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What will students learn in this lesson?"
                      {...field}
                      className="bg-muted/50 resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="video_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/video.mp4"
                      {...field}
                      className="bg-muted/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10"
                      {...field}
                      className="bg-muted/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_free"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                  <div>
                    <FormLabel className="text-base">Free Preview</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Allow non-enrolled students to view this lesson
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Saving..."
                  : editLesson
                  ? "Update Lesson"
                  : "Add Lesson"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
