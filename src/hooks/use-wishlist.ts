import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface WishlistItem {
  id: string;
  course_id: string;
  created_at: string;
}

export const useWishlist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setWishlist(data || []);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = useCallback(
    (courseId: string) => {
      return wishlist.some((item) => item.course_id === courseId);
    },
    [wishlist]
  );

  const addToWishlist = async (courseId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save courses to your wishlist.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase.from("wishlists").insert({
        user_id: user.id,
        course_id: courseId,
      });

      if (error) throw error;

      setWishlist((prev) => [
        ...prev,
        { id: crypto.randomUUID(), course_id: courseId, created_at: new Date().toISOString() },
      ]);

      toast({
        title: "Added to wishlist",
        description: "Course saved for later.",
      });
      return true;
    } catch (error: any) {
      if (error.code === "23505") {
        toast({
          title: "Already in wishlist",
          description: "This course is already in your wishlist.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add to wishlist.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const removeFromWishlist = async (courseId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("course_id", courseId);

      if (error) throw error;

      setWishlist((prev) => prev.filter((item) => item.course_id !== courseId));

      toast({
        title: "Removed from wishlist",
        description: "Course removed from your wishlist.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from wishlist.",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleWishlist = async (courseId: string) => {
    if (isInWishlist(courseId)) {
      return removeFromWishlist(courseId);
    } else {
      return addToWishlist(courseId);
    }
  };

  return {
    wishlist,
    loading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    refetch: fetchWishlist,
  };
};
