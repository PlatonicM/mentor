import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Star, Users, BookOpen, Award, Linkedin, Twitter, Globe } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface MentorProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  courses_count?: number;
  students_count?: number;
  avg_rating?: number;
}

const Mentors = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { data: mentors, isLoading } = useQuery({
    queryKey: ["mentors"],
    queryFn: async () => {
      // Get mentor user_ids from user_roles
      const { data: mentorRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "mentor");

      if (rolesError) throw rolesError;

      const mentorUserIds = mentorRoles?.map((r) => r.user_id) || [];

      if (mentorUserIds.length === 0) return [];

      // Get profiles for mentors
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", mentorUserIds);

      if (profilesError) throw profilesError;

      // Get course stats for each mentor
      const mentorsWithStats: MentorProfile[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: courses } = await supabase
            .from("courses")
            .select("id, total_students, rating")
            .eq("mentor_id", profile.user_id)
            .eq("is_published", true);

          const coursesCount = courses?.length || 0;
          const studentsCount = courses?.reduce((sum, c) => sum + (c.total_students || 0), 0) || 0;
          const avgRating = courses?.length
            ? courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length
            : 0;

          return {
            ...profile,
            courses_count: coursesCount,
            students_count: studentsCount,
            avg_rating: avgRating,
          };
        })
      );

      return mentorsWithStats;
    },
  });

  const filteredMentors = mentors?.filter((mentor) =>
    mentor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentor.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null) => {
    if (!name) return "M";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge variant="secondary" className="mb-4">
              <Award className="w-3 h-3 mr-1" />
              Expert Instructors
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Learn from{" "}
              <span className="text-gradient">Industry Experts</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Our mentors are seasoned professionals with years of real-world experience.
              They're passionate about sharing their knowledge and helping you succeed.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search mentors by name or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-full border-border/50 bg-card/50 backdrop-blur-sm"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: mentors?.length || 0, label: "Expert Mentors" },
              { icon: BookOpen, value: "500+", label: "Courses Created" },
              { icon: Star, value: "4.9", label: "Average Rating" },
              { icon: Award, value: "50K+", label: "Students Taught" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <div className="font-display text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mentors Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <Skeleton className="w-24 h-24 rounded-full mb-4" />
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48 mb-4" />
                      <Skeleton className="h-20 w-full mb-4" />
                      <div className="flex gap-4">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMentors && filteredMentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMentors.map((mentor, index) => (
                <motion.div
                  key={mentor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="relative mb-4">
                          <Avatar className="w-24 h-24 ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all">
                            <AvatarImage src={mentor.avatar_url || undefined} alt={mentor.full_name || "Mentor"} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl font-bold">
                              {getInitials(mentor.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                            <Award className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Name & Title */}
                        <h3 className="font-display text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                          {mentor.full_name || "Anonymous Mentor"}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">Expert Instructor</p>

                        {/* Rating */}
                        {mentor.avg_rating > 0 && (
                          <div className="flex items-center gap-1 mb-4">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            <span className="font-medium">{mentor.avg_rating.toFixed(1)}</span>
                            <span className="text-muted-foreground text-sm">rating</span>
                          </div>
                        )}

                        {/* Bio */}
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {mentor.bio || "Passionate about teaching and sharing knowledge with students worldwide."}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center justify-center gap-6 mb-4 text-sm">
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span className="font-medium">{mentor.courses_count}</span>
                            <span className="text-muted-foreground">courses</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="font-medium">{mentor.students_count}</span>
                            <span className="text-muted-foreground">students</span>
                          </div>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-2 mb-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <Linkedin className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <Twitter className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <Globe className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* View Profile Button */}
                        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-display text-2xl font-bold mb-2">No Mentors Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Check back soon for new instructors"}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <Badge variant="secondary" className="mb-4">
              Become a Mentor
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Share Your Expertise
            </h2>
            <p className="text-muted-foreground mb-8">
              Join our community of expert instructors and help thousands of students
              achieve their learning goals while earning from your knowledge.
            </p>
            <Button 
              size="lg" 
              className="rounded-full px-8"
              onClick={() => navigate("/become-mentor")}
            >
              Apply to Teach
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Mentors;
