import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, TrendingUp, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Course {
  id: string;
  title: string;
  total_students: number | null;
  total_reviews: number | null;
  rating: number | null;
}

interface StudentAnalyticsProps {
  courses: Course[];
}

interface EnrollmentData {
  course_id: string;
  count: number;
  avg_progress: number;
}

export const StudentAnalytics = ({ courses }: StudentAnalyticsProps) => {
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollmentData();
  }, [courses]);

  const fetchEnrollmentData = async () => {
    if (courses.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const courseIds = courses.map(c => c.id);
      
      const { data } = await supabase
        .from("enrollments")
        .select("course_id, progress_percent")
        .in("course_id", courseIds);

      if (data) {
        // Group by course and calculate stats
        const grouped: { [key: string]: { count: number; totalProgress: number } } = {};
        
        data.forEach((enrollment) => {
          if (!grouped[enrollment.course_id]) {
            grouped[enrollment.course_id] = { count: 0, totalProgress: 0 };
          }
          grouped[enrollment.course_id].count++;
          grouped[enrollment.course_id].totalProgress += enrollment.progress_percent;
        });

        const result: EnrollmentData[] = Object.entries(grouped).map(([course_id, stats]) => ({
          course_id,
          count: stats.count,
          avg_progress: Math.round(stats.totalProgress / stats.count),
        }));

        setEnrollmentData(result);
      }
    } catch (error) {
      console.error("Error fetching enrollment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return courses.map((course) => {
      const enrollment = enrollmentData.find((e) => e.course_id === course.id);
      return {
        name: course.title.length > 20 ? course.title.substring(0, 20) + "..." : course.title,
        students: enrollment?.count || course.total_students || 0,
        avgProgress: enrollment?.avg_progress || 0,
      };
    });
  }, [courses, enrollmentData]);

  const levelDistribution = useMemo(() => {
    const levels = { beginner: 0, intermediate: 0, advanced: 0 };
    courses.forEach((course) => {
      const enrollment = enrollmentData.find((e) => e.course_id === course.id);
      const count = enrollment?.count || course.total_students || 0;
      // Distribute based on progress
      if ((enrollment?.avg_progress || 0) < 30) levels.beginner += count;
      else if ((enrollment?.avg_progress || 0) < 70) levels.intermediate += count;
      else levels.advanced += count;
    });
    return [
      { name: "Beginner", value: levels.beginner, color: "hsl(142, 76%, 36%)" },
      { name: "Intermediate", value: levels.intermediate, color: "hsl(48, 96%, 53%)" },
      { name: "Advanced", value: levels.advanced, color: "hsl(0, 84%, 60%)" },
    ].filter(item => item.value > 0);
  }, [courses, enrollmentData]);

  const totalStats = useMemo(() => {
    const totalStudents = courses.reduce((acc, c) => {
      const enrollment = enrollmentData.find((e) => e.course_id === c.id);
      return acc + (enrollment?.count || c.total_students || 0);
    }, 0);

    const avgProgress = enrollmentData.length > 0
      ? Math.round(enrollmentData.reduce((acc, e) => acc + e.avg_progress, 0) / enrollmentData.length)
      : 0;

    const completionRate = enrollmentData.length > 0
      ? Math.round(enrollmentData.filter(e => e.avg_progress >= 100).length / enrollmentData.length * 100)
      : 0;

    return { totalStudents, avgProgress, completionRate };
  }, [courses, enrollmentData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-primary">Loading analytics...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-foreground">{totalStats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Progress</p>
                <p className="text-2xl font-bold text-foreground">{totalStats.avgProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10">
                <Award className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground">{totalStats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students per Course */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="font-display text-xl">Students per Course</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      width={120}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="students" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">No enrollment data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Progress Distribution */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="font-display text-xl">Student Progress Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {levelDistribution.length > 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={levelDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {levelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">No progress data yet</p>
            )}
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
              {levelDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance Table */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="font-display text-xl">Course Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length > 0 ? (
            <div className="space-y-4">
              {courses.map((course) => {
                const enrollment = enrollmentData.find((e) => e.course_id === course.id);
                const students = enrollment?.count || course.total_students || 0;
                const avgProgress = enrollment?.avg_progress || 0;

                return (
                  <div 
                    key={course.id}
                    className="p-4 rounded-lg bg-background/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{course.title}</h4>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {students} students
                        </Badge>
                        {course.rating && course.rating > 0 && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            ⭐ {course.rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg. Progress</span>
                        <span className="text-foreground">{avgProgress}%</span>
                      </div>
                      <Progress value={avgProgress} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Create your first course to see analytics</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
