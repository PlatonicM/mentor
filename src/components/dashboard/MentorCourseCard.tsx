import { motion } from "framer-motion";
import { Users, Star, Edit, Trash2, Eye, EyeOff, DollarSign, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface MentorCourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    price: number | null;
    discounted_price: number | null;
    is_published: boolean | null;
    total_students: number | null;
    total_reviews: number | null;
    rating: number | null;
    created_at: string;
    category: { name: string } | null;
  };
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onManageLessons: () => void;
}

export const MentorCourseCard = ({ course, index, onEdit, onDelete, onManageLessons }: MentorCourseCardProps) => {
  const formatPrice = (price: number | null) => {
    if (!price) return "Free";
    return `$${price.toFixed(2)}`;
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
              <span className="text-4xl">📚</span>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge className={course.is_published 
              ? "bg-green-500/90 text-white border-0" 
              : "bg-yellow-500/90 text-white border-0"
            }>
              {course.is_published ? (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Published
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Draft
                </>
              )}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Category */}
          {course.category && (
            <Badge variant="outline" className="w-fit mb-2 text-xs">
              {course.category.name}
            </Badge>
          )}

          {/* Title */}
          <h3 className="font-display font-semibold text-foreground mb-3 line-clamp-2 flex-1">
            {course.title}
          </h3>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{course.total_students || 0} students</span>
            </div>
            {course.rating && course.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>{course.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-primary" />
            {course.discounted_price ? (
              <>
                <span className="font-semibold text-foreground">
                  {formatPrice(course.discounted_price)}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(course.price)}
                </span>
              </>
            ) : (
              <span className="font-semibold text-foreground">
                {formatPrice(course.price)}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={onManageLessons}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Manage Lessons
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onEdit}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the course
                      and all associated data including enrollments and lessons.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
