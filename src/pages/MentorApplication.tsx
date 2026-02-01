import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Award, BookOpen, Users, CheckCircle, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const expertiseOptions = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Machine Learning",
  "Cloud Computing",
  "DevOps",
  "Cybersecurity",
  "UI/UX Design",
  "Digital Marketing",
  "Business & Management",
  "Finance & Accounting",
  "Personal Development",
];

const applicationSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  phone: z
    .string()
    .trim()
    .max(20, "Phone must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .min(50, "Bio must be at least 50 characters")
    .max(1000, "Bio must be less than 1000 characters"),
  expertise_areas: z
    .array(z.string())
    .min(1, "Please select at least one area of expertise")
    .max(5, "Please select up to 5 areas"),
  years_experience: z
    .string()
    .min(1, "Please select your years of experience"),
  linkedin_url: z
    .string()
    .trim()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  portfolio_url: z
    .string()
    .trim()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  reason_to_teach: z
    .string()
    .trim()
    .min(100, "Please provide at least 100 characters explaining your motivation")
    .max(2000, "Reason must be less than 2000 characters"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const MentorApplication = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      bio: "",
      expertise_areas: [],
      years_experience: "",
      linkedin_url: "",
      portfolio_url: "",
      reason_to_teach: "",
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("mentor_applications").insert({
        user_id: user?.id || null,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        bio: data.bio,
        expertise_areas: data.expertise_areas,
        years_experience: parseInt(data.years_experience),
        linkedin_url: data.linkedin_url || null,
        portfolio_url: data.portfolio_url || null,
        reason_to_teach: data.reason_to_teach,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you soon.",
      });
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedExpertise = form.watch("expertise_areas");

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">
              Application Submitted!
            </h1>
            <p className="text-muted-foreground mb-8">
              Thank you for applying to become a mentor. Our team will review your
              application and get back to you within 3-5 business days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate("/mentors")}>
                Browse Mentors
              </Button>
              <Button variant="outline" onClick={() => navigate("/courses")}>
                Explore Courses
              </Button>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
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
              Become a Mentor
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Share Your Knowledge,{" "}
              <span className="text-gradient">Impact Lives</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Join our community of expert instructors and help students worldwide
              achieve their learning goals while earning from your expertise.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Reach Thousands",
                description: "Access our global community of eager learners",
              },
              {
                icon: BookOpen,
                title: "Create & Earn",
                description: "Set your own prices and earn up to 70% revenue share",
              },
              {
                icon: Award,
                title: "Build Your Brand",
                description: "Establish yourself as an industry thought leader",
              },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <benefit.icon className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-display text-lg font-semibold mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Mentor Application</CardTitle>
                <CardDescription>
                  Fill out the form below to apply. All fields marked with * are
                  required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Personal Information</h3>
                      
                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="john@example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 234 567 8900" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Professional Background */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Professional Background</h3>

                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Professional Bio *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about your professional background, achievements, and what makes you qualified to teach..."
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value.length}/1000 characters (minimum 50)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expertise_areas"
                        render={() => (
                          <FormItem>
                            <FormLabel>Areas of Expertise *</FormLabel>
                            <FormDescription>
                              Select up to 5 areas ({selectedExpertise.length}/5 selected)
                            </FormDescription>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                              {expertiseOptions.map((option) => (
                                <FormField
                                  key={option}
                                  control={form.control}
                                  name="expertise_areas"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(option)}
                                          disabled={
                                            !field.value?.includes(option) &&
                                            field.value?.length >= 5
                                          }
                                          onCheckedChange={(checked) => {
                                            const newValue = checked
                                              ? [...(field.value || []), option]
                                              : field.value?.filter((v) => v !== option);
                                            field.onChange(newValue);
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer">
                                        {option}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="years_experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select experience level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1-2 years</SelectItem>
                                <SelectItem value="3">3-5 years</SelectItem>
                                <SelectItem value="6">6-10 years</SelectItem>
                                <SelectItem value="11">10+ years</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Online Presence */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Online Presence</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="linkedin_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn Profile (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://linkedin.com/in/yourprofile"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="portfolio_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Portfolio/Website (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://yourwebsite.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Motivation */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Your Motivation</h3>

                      <FormField
                        control={form.control}
                        name="reason_to_teach"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Why do you want to become a mentor? *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us why you're passionate about teaching and what kind of courses you'd like to create..."
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value.length}/2000 characters (minimum 100)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MentorApplication;