import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users, BookOpen, UserCheck, DollarSign, FileCheck,
  Clock, CheckCircle, XCircle, TrendingUp, Shield, UserCog, Plus, Trash2, Ban, UserX, Download
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MentorApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  bio: string;
  expertise_areas: string[];
  years_experience: number;
  linkedin_url: string | null;
  portfolio_url: string | null;
  reason_to_teach: string;
  status: string;
  user_id: string | null;
  created_at: string;
}

interface CourseStats {
  id: string;
  title: string;
  is_published: boolean | null;
  total_students: number | null;
  rating: number | null;
  mentor_name: string | null;
}

interface PlatformStats {
  totalUsers: number;
  totalMentors: number;
  totalCourses: number;
  totalEnrollments: number;
  pendingApplications: number;
  totalRevenue: number;
  totalPlatformFees: number;
  totalTransactions: number;
}

interface Transaction {
  id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  created_at: string;
  course_title: string;
  mentor_name: string | null;
  student_name: string | null;
}

interface UserWithRoles {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  roles: ("student" | "mentor" | "admin")[];
  is_banned: boolean;
  ban_reason: string | null;
}

const AdminDashboard = () => {
  const { user, roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [courses, setCourses] = useState<CourseStats[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalMentors: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    pendingApplications: 0,
    totalRevenue: 0,
    totalPlatformFees: 0,
    totalTransactions: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<MentorApplication | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [roleAction, setRoleAction] = useState<{ type: "add" | "remove"; role: "student" | "mentor" | "admin" } | null>(null);
  const [banAction, setBanAction] = useState<{ type: "ban" | "unban"; reason?: string } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [chartPeriod, setChartPeriod] = useState<"weekly" | "monthly">("monthly");

  const isAdmin = roles.includes("admin");

  // Calculate chart data from transactions
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    const now = new Date();
    const data: { name: string; revenue: number; fees: number }[] = [];

    if (chartPeriod === "monthly") {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthTransactions = transactions.filter(t => {
          const date = new Date(t.created_at);
          return date >= month && date <= monthEnd && t.status === "completed";
        });

        const revenue = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
        const fees = monthTransactions.reduce((sum, t) => sum + t.platform_fee, 0);

        data.push({
          name: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue,
          fees,
        });
      }
    } else {
      // Last 8 weeks
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekTransactions = transactions.filter(t => {
          const date = new Date(t.created_at);
          return date >= weekStart && date <= weekEnd && t.status === "completed";
        });

        const revenue = weekTransactions.reduce((sum, t) => sum + t.amount, 0);
        const fees = weekTransactions.reduce((sum, t) => sum + t.platform_fee, 0);

        data.push({
          name: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          revenue,
          fees,
        });
      }
    }

    return data;
  }, [transactions, chartPeriod]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading && user && !isAdmin) {
      navigate("/dashboard");
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAdminData();
    }
  }, [user, isAdmin]);

  const fetchAdminData = async () => {
    try {
      // Fetch mentor applications
      const { data: appsData } = await supabase
        .from("mentor_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (appsData) {
        setApplications(appsData);
      }

      // Fetch courses with mentor info
      const { data: coursesData } = await supabase
        .from("courses")
        .select(`
          id, title, is_published, total_students, rating, mentor_id
        `)
        .order("created_at", { ascending: false });

      if (coursesData) {
        // Get mentor profiles
        const mentorIds = [...new Set(coursesData.map(c => c.mentor_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", mentorIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        
        setCourses(coursesData.map(c => ({
          ...c,
          mentor_name: profileMap.get(c.mentor_id) || "Unknown"
        })));
      }

      // Fetch all users with their profiles and roles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, created_at, is_banned, ban_reason")
        .order("created_at", { ascending: false });

      if (profilesData) {
        // Fetch all roles
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role");

        // Create a map of user_id to roles
        const rolesMap = new Map<string, ("student" | "mentor" | "admin")[]>();
        rolesData?.forEach(r => {
          const existing = rolesMap.get(r.user_id) || [];
          rolesMap.set(r.user_id, [...existing, r.role as "student" | "mentor" | "admin"]);
        });

        // Combine profiles with roles
        const usersWithRoles: UserWithRoles[] = profilesData.map(p => ({
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          email: "",
          created_at: p.created_at,
          roles: rolesMap.get(p.user_id) || ["student"],
          is_banned: p.is_banned || false,
          ban_reason: p.ban_reason,
        }));

        setUsers(usersWithRoles);
      }

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (transactionsData) {
        // Get course and user info
        const courseIds = [...new Set(transactionsData.map(t => t.course_id))];
        const mentorIds = [...new Set(transactionsData.map(t => t.mentor_id))];
        const studentIds = [...new Set(transactionsData.map(t => t.student_id))];

        const { data: coursesInfo } = await supabase
          .from("courses")
          .select("id, title")
          .in("id", courseIds);

        const { data: profilesInfo } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", [...mentorIds, ...studentIds]);

        const courseMap = new Map(coursesInfo?.map(c => [c.id, c.title]) || []);
        const profileMap = new Map(profilesInfo?.map(p => [p.user_id, p.full_name]) || []);

        const transactionsWithDetails: Transaction[] = transactionsData.map(t => ({
          id: t.id,
          amount: Number(t.amount),
          platform_fee: Number(t.platform_fee),
          net_amount: Number(t.net_amount),
          status: t.status,
          created_at: t.created_at,
          course_title: courseMap.get(t.course_id) || "Unknown Course",
          mentor_name: profileMap.get(t.mentor_id) || null,
          student_name: profileMap.get(t.student_id) || null,
        }));

        setTransactions(transactionsWithDetails);
      }

      // Fetch stats
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: mentorsCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "mentor");

      const { count: coursesCount } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true });

      const { count: enrollmentsCount } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true });

      // Calculate revenue stats from transactions
      const { data: revenueData } = await supabase
        .from("transactions")
        .select("amount, platform_fee")
        .eq("status", "completed");

      const totalRevenue = revenueData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalPlatformFees = revenueData?.reduce((sum, t) => sum + Number(t.platform_fee), 0) || 0;

      const pendingApps = appsData?.filter(a => a.status === "pending").length || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalMentors: mentorsCount || 0,
        totalCourses: coursesCount || 0,
        totalEnrollments: enrollmentsCount || 0,
        pendingApplications: pendingApps,
        totalRevenue,
        totalPlatformFees,
        totalTransactions: revenueData?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async () => {
    if (!selectedApplication || !actionType) return;

    try {
      const newStatus = actionType === "approve" ? "approved" : "rejected";

      // Update application status
      const { error: updateError } = await supabase
        .from("mentor_applications")
        .update({ status: newStatus })
        .eq("id", selectedApplication.id);

      if (updateError) throw updateError;

      // If approved and user_id exists, add mentor role
      if (actionType === "approve" && selectedApplication.user_id) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: selectedApplication.user_id,
            role: "mentor" as const,
          });

        if (roleError && !roleError.message.includes("duplicate")) {
          throw roleError;
        }
      }

      toast({
        title: actionType === "approve" ? "Application Approved" : "Application Rejected",
        description: `${selectedApplication.full_name}'s application has been ${newStatus}.`,
      });

      // Refresh data
      fetchAdminData();
    } catch (error) {
      console.error("Error updating application:", error);
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    } finally {
      setSelectedApplication(null);
      setActionType(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case "mentor":
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30"><UserCheck className="w-3 h-3 mr-1" />Mentor</Badge>;
      case "student":
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30"><Users className="w-3 h-3 mr-1" />Student</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const handleRoleAction = async () => {
    if (!selectedUser || !roleAction) return;

    try {
      if (roleAction.type === "add") {
        const { error } = await supabase
          .from("user_roles")
          .insert({
            user_id: selectedUser.user_id,
            role: roleAction.role,
          });

        if (error) {
          if (error.message.includes("duplicate")) {
            toast({
              title: "Role Already Exists",
              description: `${selectedUser.full_name || "User"} already has the ${roleAction.role} role.`,
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Role Added",
          description: `${roleAction.role} role has been added to ${selectedUser.full_name || "user"}.`,
        });
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", selectedUser.user_id)
          .eq("role", roleAction.role);

        if (error) throw error;

        toast({
          title: "Role Removed",
          description: `${roleAction.role} role has been removed from ${selectedUser.full_name || "user"}.`,
        });
      }

      fetchAdminData();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    } finally {
      setSelectedUser(null);
      setRoleAction(null);
    }
  };

  const handleBanAction = async () => {
    if (!selectedUser || !banAction) return;

    try {
      if (banAction.type === "ban") {
        const { error } = await supabase
          .from("profiles")
          .update({
            is_banned: true,
            banned_at: new Date().toISOString(),
            ban_reason: banReason || null,
          })
          .eq("user_id", selectedUser.user_id);

        if (error) throw error;

        toast({
          title: "User Banned",
          description: `${selectedUser.full_name || "User"} has been banned from the platform.`,
        });
      } else {
        const { error } = await supabase
          .from("profiles")
          .update({
            is_banned: false,
            banned_at: null,
            ban_reason: null,
          })
          .eq("user_id", selectedUser.user_id);

        if (error) throw error;

        toast({
          title: "User Unbanned",
          description: `${selectedUser.full_name || "User"} has been unbanned.`,
        });
      }

      fetchAdminData();
    } catch (error) {
      console.error("Error updating ban status:", error);
      toast({
        title: "Error",
        description: "Failed to update user ban status.",
        variant: "destructive",
      });
    } finally {
      setSelectedUser(null);
      setBanAction(null);
      setBanReason("");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage the platform, review applications, and monitor activity.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
          >
            <StatsCard
              icon={Users}
              label="Total Users"
              value={stats.totalUsers}
              color="primary"
            />
            <StatsCard
              icon={UserCheck}
              label="Mentors"
              value={stats.totalMentors}
              color="accent"
            />
            <StatsCard
              icon={BookOpen}
              label="Courses"
              value={stats.totalCourses}
              color="secondary"
            />
            <StatsCard
              icon={TrendingUp}
              label="Enrollments"
              value={stats.totalEnrollments}
              color="primary"
            />
            <StatsCard
              icon={FileCheck}
              label="Pending Apps"
              value={stats.pendingApplications}
              color="accent"
            />
          </motion.div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="applications" className="space-y-6">
            <TabsList className="bg-card/50 border border-border flex-wrap">
              <TabsTrigger value="applications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileCheck className="w-4 h-4 mr-2" />
                Mentor Applications
                {stats.pendingApplications > 0 && (
                  <Badge className="ml-2 bg-primary/20">{stats.pendingApplications}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <UserCog className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BookOpen className="w-4 h-4 mr-2" />
                All Courses
              </TabsTrigger>
              <TabsTrigger value="revenue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <DollarSign className="w-4 h-4 mr-2" />
                Revenue
              </TabsTrigger>
            </TabsList>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle>Mentor Applications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {applications.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Applicant</TableHead>
                            <TableHead>Expertise</TableHead>
                            <TableHead>Experience</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {applications.map((app) => (
                            <TableRow key={app.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{app.full_name}</p>
                                  <p className="text-sm text-muted-foreground">{app.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {app.expertise_areas.slice(0, 2).map((area) => (
                                    <Badge key={area} variant="outline" className="text-xs">
                                      {area}
                                    </Badge>
                                  ))}
                                  {app.expertise_areas.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{app.expertise_areas.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{app.years_experience} years</TableCell>
                              <TableCell>{getStatusBadge(app.status)}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(app.created_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-right">
                                {app.status === "pending" && (
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                                      onClick={() => {
                                        setSelectedApplication(app);
                                        setActionType("approve");
                                      }}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                                      onClick={() => {
                                        setSelectedApplication(app);
                                        setActionType("reject");
                                      }}
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12">
                        <FileCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                          No applications yet
                        </h3>
                        <p className="text-muted-foreground">
                          Mentor applications will appear here.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle>All Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {users.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((u) => (
                            <TableRow key={u.id} className={u.is_banned ? "opacity-60" : ""}>
                              <TableCell>
                                <div>
                                  <p className="font-medium flex items-center gap-2">
                                    {u.full_name || "No name"}
                                    {u.is_banned && <Ban className="w-4 h-4 text-red-400" />}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{u.user_id.slice(0, 8)}...</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {u.roles.map((role) => (
                                    <span key={role}>{getRoleBadge(role)}</span>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                {u.is_banned ? (
                                  <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                                    <Ban className="w-3 h-3 mr-1" />Banned
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                    <CheckCircle className="w-3 h-3 mr-1" />Active
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(u.created_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <Select
                                    onValueChange={(value) => {
                                      const [action, role] = value.split("-") as ["add" | "remove", "student" | "mentor" | "admin"];
                                      setSelectedUser(u);
                                      setRoleAction({ type: action, role });
                                    }}
                                  >
                                    <SelectTrigger className="w-[130px]">
                                      <SelectValue placeholder="Roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {!u.roles.includes("mentor") && (
                                        <SelectItem value="add-mentor">
                                          <span className="flex items-center gap-2">
                                            <Plus className="w-3 h-3" /> Add Mentor
                                          </span>
                                        </SelectItem>
                                      )}
                                      {u.roles.includes("mentor") && (
                                        <SelectItem value="remove-mentor">
                                          <span className="flex items-center gap-2">
                                            <Trash2 className="w-3 h-3" /> Remove Mentor
                                          </span>
                                        </SelectItem>
                                      )}
                                      {!u.roles.includes("admin") && (
                                        <SelectItem value="add-admin">
                                          <span className="flex items-center gap-2">
                                            <Plus className="w-3 h-3" /> Add Admin
                                          </span>
                                        </SelectItem>
                                      )}
                                      {u.roles.includes("admin") && u.user_id !== user?.id && (
                                        <SelectItem value="remove-admin">
                                          <span className="flex items-center gap-2">
                                            <Trash2 className="w-3 h-3" /> Remove Admin
                                          </span>
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  {u.user_id !== user?.id && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className={u.is_banned 
                                        ? "text-green-400 border-green-500/30 hover:bg-green-500/10" 
                                        : "text-red-400 border-red-500/30 hover:bg-red-500/10"}
                                      onClick={() => {
                                        setSelectedUser(u);
                                        setBanAction({ type: u.is_banned ? "unban" : "ban" });
                                      }}
                                    >
                                      {u.is_banned ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                          No users yet
                        </h3>
                        <p className="text-muted-foreground">
                          Users will appear here once they sign up.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle>All Courses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {courses.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course Title</TableHead>
                            <TableHead>Mentor</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {courses.map((course) => (
                            <TableRow key={course.id}>
                              <TableCell className="font-medium">{course.title}</TableCell>
                              <TableCell className="text-muted-foreground">{course.mentor_name}</TableCell>
                              <TableCell>{course.total_students || 0}</TableCell>
                              <TableCell>
                                {course.rating ? `${course.rating.toFixed(1)} ⭐` : "N/A"}
                              </TableCell>
                              <TableCell>
                                {course.is_published ? (
                                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                    Published
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Draft</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                          No courses yet
                        </h3>
                        <p className="text-muted-foreground">
                          Courses created by mentors will appear here.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* Revenue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card variant="glass">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-green-500/20">
                          <DollarSign className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Revenue</p>
                          <p className="text-2xl font-bold text-foreground">
                            ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card variant="glass">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/20">
                          <TrendingUp className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Platform Fees</p>
                          <p className="text-2xl font-bold text-foreground">
                            ${stats.totalPlatformFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card variant="glass">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/20">
                          <FileCheck className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Transactions</p>
                          <p className="text-2xl font-bold text-foreground">
                            {stats.totalTransactions}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue Chart */}
                <Card variant="glass">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Revenue Trends</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={chartPeriod === "weekly" ? "default" : "outline"}
                        onClick={() => setChartPeriod("weekly")}
                      >
                        Weekly
                      </Button>
                      <Button
                        size="sm"
                        variant={chartPeriod === "monthly" ? "default" : "outline"}
                        onClick={() => setChartPeriod("monthly")}
                      >
                        Monthly
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {chartData.length > 0 && chartData.some(d => d.revenue > 0 || d.fees > 0) ? (
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="name" 
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={12}
                              tickLine={false}
                            />
                            <YAxis 
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={12}
                              tickLine={false}
                              tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                color: 'hsl(var(--foreground))'
                              }}
                              formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                            />
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="revenue" 
                              name="Total Revenue"
                              stroke="hsl(var(--primary))" 
                              fillOpacity={1} 
                              fill="url(#colorRevenue)" 
                              strokeWidth={2}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="fees" 
                              name="Platform Fees"
                              stroke="#22c55e" 
                              fillOpacity={1} 
                              fill="url(#colorFees)" 
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center">
                        <div className="text-center">
                          <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No revenue data to display yet</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transaction History */}
                <Card variant="glass">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Transaction History</CardTitle>
                    {transactions.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const headers = ["Date", "Course", "Student", "Mentor", "Amount", "Platform Fee", "Net Amount", "Status"];
                          const rows = transactions.map(t => [
                            format(new Date(t.created_at), "yyyy-MM-dd"),
                            t.course_title,
                            t.student_name || "Unknown",
                            t.mentor_name || "Unknown",
                            t.amount.toFixed(2),
                            t.platform_fee.toFixed(2),
                            t.net_amount.toFixed(2),
                            t.status
                          ]);
                          const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
                          const blob = new Blob([csv], { type: "text/csv" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast({ title: "Export Complete", description: "Transaction history downloaded as CSV." });
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {transactions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Mentor</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Platform Fee</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(transaction.created_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="font-medium max-w-[200px] truncate">
                                {transaction.course_title}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {transaction.student_name || "Unknown"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {transaction.mentor_name || "Unknown"}
                              </TableCell>
                              <TableCell className="font-medium text-green-400">
                                ${transaction.amount.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-primary">
                                ${transaction.platform_fee.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {transaction.status === "completed" ? (
                                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                    <CheckCircle className="w-3 h-3 mr-1" />Completed
                                  </Badge>
                                ) : transaction.status === "pending" ? (
                                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                    <Clock className="w-3 h-3 mr-1" />Pending
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">{transaction.status}</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12">
                        <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                          No transactions yet
                        </h3>
                        <p className="text-muted-foreground">
                          Transaction history will appear here once courses are purchased.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedApplication && !!actionType} onOpenChange={() => {
        setSelectedApplication(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve Application" : "Reject Application"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? `Are you sure you want to approve ${selectedApplication?.full_name}'s mentor application? They will receive mentor privileges.`
                : `Are you sure you want to reject ${selectedApplication?.full_name}'s mentor application?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApplicationAction}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {actionType === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Action Dialog */}
      <AlertDialog open={!!selectedUser && !!roleAction} onOpenChange={() => {
        setSelectedUser(null);
        setRoleAction(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {roleAction?.type === "add" ? "Add Role" : "Remove Role"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {roleAction?.type === "add"
                ? `Are you sure you want to add the ${roleAction?.role} role to ${selectedUser?.full_name || "this user"}?`
                : `Are you sure you want to remove the ${roleAction?.role} role from ${selectedUser?.full_name || "this user"}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleAction}
              className={roleAction?.type === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {roleAction?.type === "add" ? "Add Role" : "Remove Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban Action Dialog */}
      <AlertDialog open={!!selectedUser && !!banAction} onOpenChange={() => {
        setSelectedUser(null);
        setBanAction(null);
        setBanReason("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {banAction?.type === "ban" ? "Ban User" : "Unban User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {banAction?.type === "ban"
                ? `Are you sure you want to ban ${selectedUser?.full_name || "this user"}? They will no longer be able to access the platform.`
                : `Are you sure you want to unban ${selectedUser?.full_name || "this user"}? They will regain access to the platform.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {banAction?.type === "ban" && (
            <div className="py-4">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Reason for ban (optional)
              </label>
              <Textarea
                placeholder="Enter reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanAction}
              className={banAction?.type === "ban" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {banAction?.type === "ban" ? "Ban User" : "Unban User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;