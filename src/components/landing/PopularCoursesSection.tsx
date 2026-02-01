import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  Clock, 
  Users, 
  Play,
  ArrowRight
} from "lucide-react";

const courses = [
  {
    id: 1,
    title: "Complete Web Development Bootcamp",
    instructor: "Sarah Johnson",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop",
    category: "Development",
    rating: 4.9,
    students: 15420,
    duration: "42 hours",
    price: 89.99,
    originalPrice: 199.99,
    level: "Beginner",
  },
  {
    id: 2,
    title: "Advanced Machine Learning & AI",
    instructor: "Dr. Michael Chen",
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop",
    category: "Data Science",
    rating: 4.8,
    students: 8930,
    duration: "56 hours",
    price: 129.99,
    originalPrice: 299.99,
    level: "Advanced",
  },
  {
    id: 3,
    title: "UI/UX Design Masterclass",
    instructor: "Emily Davis",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=225&fit=crop",
    category: "Design",
    rating: 4.9,
    students: 12350,
    duration: "38 hours",
    price: 79.99,
    originalPrice: 179.99,
    level: "Intermediate",
  },
  {
    id: 4,
    title: "Digital Marketing Strategy",
    instructor: "Alex Thompson",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop",
    category: "Marketing",
    rating: 4.7,
    students: 9870,
    duration: "28 hours",
    price: 69.99,
    originalPrice: 149.99,
    level: "Beginner",
  },
];

const levelColors = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "destructive",
} as const;

export function PopularCoursesSection() {
  return (
    <section className="py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-12"
        >
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Popular <span className="text-gradient">Courses</span>
            </h2>
            <p className="text-muted-foreground">
              Explore our most loved courses by thousands of students
            </p>
          </div>
          <Link to="/courses">
            <Button variant="ghost" className="gap-2">
              View All Courses
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/courses/${course.id}`}>
                <Card variant="gradient" className="overflow-hidden card-hover group h-full">
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-60" />
                    <div className="absolute top-3 left-3">
                      <Badge variant={levelColors[course.level as keyof typeof levelColors]}>
                        {course.level}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center">
                        <Play className="w-6 h-6 text-background fill-background" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <Badge variant="outline" className="mb-3 text-xs">
                      {course.category}
                    </Badge>
                    <h3 className="font-display font-semibold text-lg mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      by {course.instructor}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                        <span className="font-medium text-foreground">{course.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {course.students.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {course.duration}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xl font-bold text-accent">
                        ${course.price}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        ${course.originalPrice}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
