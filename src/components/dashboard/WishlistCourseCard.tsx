import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, Clock, Users, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

interface WishlistCourseCardProps {
  course: WishlistCourse;
  index: number;
  onRemove: () => void;
}

export const WishlistCourseCard = ({ course, index, onRemove }: WishlistCourseCardProps) => {
  const getLevelBadgeVariant = (level: string | null) => {
    switch (level) {
      case "beginner":
        return "secondary";
      case "intermediate":
        return "default";
      case "advanced":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-accent/50">
        <Link to={`/course/${course.slug}`}>
          <div className="relative aspect-video overflow-hidden">
            <img
              src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getLevelBadgeVariant(course.level)}>
                {course.level || "Beginner"}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-accent transition-colors">
              {course.title}
            </h3>
          </CardHeader>

          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.short_description}
            </p>

            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-foreground">{course.rating || 0}</span>
                <span>({(course.total_reviews || 0).toLocaleString()})</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{(course.total_students || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{course.duration_hours || 0}h</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {course.discounted_price ? (
                <>
                  <span className="text-xl font-bold text-foreground">
                    ₹{course.discounted_price.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{(course.price || 0).toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-foreground">
                  {course.price === 0 ? "Free" : `₹${(course.price || 0).toLocaleString()}`}
                </span>
              )}
            </div>
          </CardFooter>
        </Link>
        
        <div className="px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove from Wishlist
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
