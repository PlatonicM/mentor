import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  user_id: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CourseReviewsProps {
  courseId: string;
  isEnrolled: boolean;
}

export const CourseReviews = ({ courseId, isEnrolled }: CourseReviewsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  const fetchReviews = async () => {
    try {
      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      // Fetch profiles for review authors
      const userIds = [...new Set(reviewsData?.map(r => r.user_id) || [])];
      let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        profilesData?.forEach(p => {
          profilesMap[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        });
      }

      const reviewsWithProfiles: Review[] = (reviewsData || []).map(r => ({
        ...r,
        profile: profilesMap[r.user_id] || null,
      }));

      setReviews(reviewsWithProfiles);

      // Find user's review
      if (user) {
        const found = reviewsWithProfiles.find(r => r.user_id === user.id);
        setUserReview(found || null);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewDialog = (review?: Review) => {
    if (review) {
      setEditingReview(review);
      setRating(review.rating);
      setTitle(review.title || "");
      setContent(review.content || "");
    } else {
      setEditingReview(null);
      setRating(5);
      setTitle("");
      setContent("");
    }
    setShowReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      if (editingReview) {
        const { error } = await supabase
          .from("reviews")
          .update({
            rating,
            title: title || null,
            content: content || null,
          })
          .eq("id", editingReview.id);

        if (error) throw error;
        toast({ title: "Review updated successfully!" });
      } else {
        const { error } = await supabase.from("reviews").insert({
          course_id: courseId,
          user_id: user.id,
          rating,
          title: title || null,
          content: content || null,
        });

        if (error) throw error;
        toast({ title: "Review submitted successfully!" });
      }

      setShowReviewDialog(false);
      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", userReview.id);

      if (error) throw error;

      toast({ title: "Review deleted" });
      setShowDeleteDialog(false);
      setUserReview(null);
      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const StarRating = ({
    value,
    onChange,
    readonly = false,
    size = "md",
  }: {
    value: number;
    onChange?: (val: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
  }) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-7 h-7",
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            onClick={() => onChange?.(star)}
          >
            <Star
              className={`${sizeClasses[size]} ${
                star <= (hoverRating || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-muted/50 rounded-lg p-4 h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">
            Reviews ({reviews.length})
          </h3>
        </div>

        {isEnrolled && user && !userReview && (
          <Button onClick={() => handleOpenReviewDialog()}>
            Write a Review
          </Button>
        )}
      </div>

      {/* User's Review */}
      {userReview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border border-primary/20 rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={userReview.profile?.avatar_url || undefined} />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">Your Review</p>
                <StarRating value={userReview.rating} readonly size="sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenReviewDialog(userReview)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
          {userReview.title && (
            <h4 className="font-medium mb-1">{userReview.title}</h4>
          )}
          {userReview.content && (
            <p className="text-muted-foreground text-sm">{userReview.content}</p>
          )}
        </motion.div>
      )}

      {/* Reviews List */}
      <AnimatePresence>
        {reviews
          .filter((r) => r.user_id !== user?.id)
          .map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card/50 border border-border/50 rounded-lg p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar>
                  <AvatarImage src={review.profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {review.profile?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">
                      {review.profile?.full_name || "Anonymous"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <StarRating value={review.rating} readonly size="sm" />
                </div>
              </div>
              {review.title && (
                <h4 className="font-medium mb-1">{review.title}</h4>
              )}
              {review.content && (
                <p className="text-muted-foreground text-sm">{review.content}</p>
              )}
            </motion.div>
          ))}
      </AnimatePresence>

      {reviews.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No reviews yet. Be the first to review!</p>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReview ? "Edit Your Review" : "Write a Review"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">Your Rating</p>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>

            <div>
              <Input
                placeholder="Review title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Textarea
                placeholder="Share your experience with this course..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={submitting}>
              {submitting ? "Submitting..." : editingReview ? "Update" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your review will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReview}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
