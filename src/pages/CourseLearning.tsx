import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourseLearning() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseSlug = async () => {
      if (!id) {
        navigate("/");
        return;
      }

      try {
        // Try to find course by ID first
        const { data, error } = await supabase
          .from("courses")
          .select("slug")
          .eq("id", id)
          .maybeSingle();

        if (data?.slug) {
          navigate(`/course/${data.slug}`, { replace: true });
          return;
        }

        // If not found by ID, try by slug directly
        const { data: slugData } = await supabase
          .from("courses")
          .select("slug")
          .eq("slug", id)
          .maybeSingle();

        if (slugData?.slug) {
          navigate(`/course/${slugData.slug}`, { replace: true });
        } else if (id) {
          // Try direct navigation with ID as slug
          navigate(`/course/${id}`, { replace: true });
        } else {
          navigate("/courses", { replace: true });
        }
      } catch (error) {
        console.error("Error fetching course:", error);
        navigate("/courses", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchCourseSlug();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="w-16 h-16 rounded-full mx-auto" />
          <Skeleton className="w-48 h-4 mx-auto" />
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  return null;
}
