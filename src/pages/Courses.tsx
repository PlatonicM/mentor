import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Grid, List, Star, Clock, Users, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useWishlist } from "@/hooks/use-wishlist";
import { WishlistButton } from "@/components/WishlistButton";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  thumbnail_url: string;
  price: number;
  discounted_price: number | null;
  duration_hours: number;
  level: string;
  rating: number;
  total_reviews: number;
  total_students: number;
  is_featured: boolean;
  category_id: string;
  categories?: Category;
}

// Mock courses for demo
const mockCourses: Course[] = [
  {
    id: "1",
    title: "Complete React Developer Course 2024",
    slug: "complete-react-developer-2024",
    short_description: "Master React, Redux, Hooks, and build real-world projects with modern best practices.",
    thumbnail_url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
    price: 4999,
    discounted_price: 999,
    duration_hours: 42,
    level: "intermediate",
    rating: 4.8,
    total_reviews: 2340,
    total_students: 15420,
    is_featured: true,
    category_id: "1",
  },
  {
    id: "2",
    title: "Python for Data Science & Machine Learning",
    slug: "python-data-science-ml",
    short_description: "Learn Python, Pandas, NumPy, Matplotlib, and Machine Learning from scratch.",
    thumbnail_url: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800",
    price: 5999,
    discounted_price: 1499,
    duration_hours: 56,
    level: "beginner",
    rating: 4.9,
    total_reviews: 3210,
    total_students: 22150,
    is_featured: true,
    category_id: "3",
  },
  {
    id: "3",
    title: "UI/UX Design Masterclass with Figma",
    slug: "uiux-design-figma",
    short_description: "Create stunning user interfaces and experiences using industry-standard tools.",
    thumbnail_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
    price: 3999,
    discounted_price: 799,
    duration_hours: 28,
    level: "beginner",
    rating: 4.7,
    total_reviews: 1890,
    total_students: 12340,
    is_featured: false,
    category_id: "5",
  },
  {
    id: "4",
    title: "Advanced Node.js & Express API Development",
    slug: "advanced-nodejs-express",
    short_description: "Build scalable backend APIs with Node.js, Express, MongoDB, and authentication.",
    thumbnail_url: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800",
    price: 4499,
    discounted_price: 1199,
    duration_hours: 38,
    level: "advanced",
    rating: 4.6,
    total_reviews: 1560,
    total_students: 8920,
    is_featured: true,
    category_id: "1",
  },
  {
    id: "5",
    title: "Flutter Mobile App Development",
    slug: "flutter-mobile-dev",
    short_description: "Build beautiful cross-platform mobile apps with Flutter and Dart.",
    thumbnail_url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800",
    price: 4999,
    discounted_price: 1299,
    duration_hours: 45,
    level: "intermediate",
    rating: 4.8,
    total_reviews: 2100,
    total_students: 14560,
    is_featured: false,
    category_id: "2",
  },
  {
    id: "6",
    title: "Digital Marketing Complete Course",
    slug: "digital-marketing-complete",
    short_description: "Master SEO, Social Media, Google Ads, and Content Marketing strategies.",
    thumbnail_url: "https://images.unsplash.com/photo-1432888622747-4eb9a8f5a07c?w=800",
    price: 3499,
    discounted_price: 699,
    duration_hours: 32,
    level: "beginner",
    rating: 4.5,
    total_reviews: 980,
    total_students: 6780,
    is_featured: false,
    category_id: "6",
  },
];

const Courses = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(mockCourses);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      
      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Fetch published courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select(`
          *,
          categories (*)
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (coursesData && coursesData.length > 0) {
        setCourses(coursesData as unknown as Course[]);
        setFilteredCourses(coursesData as unknown as Course[]);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  // Filter and sort courses
  useEffect(() => {
    let result = [...courses];

    // Search filter
    if (searchQuery) {
      result = result.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((course) => course.category_id === selectedCategory);
    }

    // Level filter
    if (selectedLevel !== "all") {
      result = result.filter((course) => course.level === selectedLevel);
    }

    // Sorting
    switch (sortBy) {
      case "popular":
        result.sort((a, b) => b.total_students - a.total_students);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case "price-low":
        result.sort((a, b) => (a.discounted_price || a.price) - (b.discounted_price || b.price));
        break;
      case "price-high":
        result.sort((a, b) => (b.discounted_price || b.price) - (a.discounted_price || a.price));
        break;
    }

    setFilteredCourses(result);
  }, [courses, searchQuery, selectedCategory, selectedLevel, sortBy]);

  const getLevelBadgeVariant = (level: string) => {
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
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Explore Our <span className="gradient-text">Courses</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Discover thousands of courses taught by industry experts
          </motion.p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-6 px-4 border-b border-border/50 sticky top-16 bg-background/95 backdrop-blur-sm z-40">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mt-4">
            Showing <span className="font-medium text-foreground">{filteredCourses.length}</span> courses
          </p>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">No courses found</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedLevel("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <motion.div
              layout
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/course/${course.slug}`}>
                    <Card
                      className={`group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-accent/50 ${
                        viewMode === "list" ? "flex" : ""
                      }`}
                    >
                      {/* Thumbnail */}
                      <div
                        className={`relative overflow-hidden ${
                          viewMode === "list" ? "w-64 flex-shrink-0" : "aspect-video"
                        }`}
                      >
                        <img
                          src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {course.is_featured && (
                          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                            Featured
                          </Badge>
                        )}
                        <WishlistButton
                          isWishlisted={isInWishlist(course.id)}
                          onToggle={() => toggleWishlist(course.id)}
                          className="absolute top-3 right-3 bg-background/80 hover:bg-background"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="sm" variant="secondary" className="gap-2">
                            <Play className="h-4 w-4" />
                            Preview
                          </Button>
                        </div>
                      </div>

                      <div className="flex-1">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getLevelBadgeVariant(course.level)}>
                              {course.level}
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

                          {/* Stats */}
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium text-foreground">{course.rating}</span>
                              <span>({course.total_reviews.toLocaleString()})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{course.total_students.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{course.duration_hours}h</span>
                            </div>
                          </div>
                        </CardContent>

                        <CardFooter className="pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2">
                            {course.discounted_price ? (
                              <>
                                <span className="text-xl font-bold text-foreground">
                                  ₹{course.discounted_price.toLocaleString()}
                                </span>
                                <span className="text-sm text-muted-foreground line-through">
                                  ₹{course.price.toLocaleString()}
                                </span>
                                <Badge variant="outline" className="text-green-500 border-green-500/50">
                                  {Math.round(((course.price - course.discounted_price) / course.price) * 100)}% off
                                </Badge>
                              </>
                            ) : (
                              <span className="text-xl font-bold text-foreground">
                                ₹{course.price.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </CardFooter>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Courses;
