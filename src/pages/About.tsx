import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Users,
  Trophy,
  Target,
  Heart,
  Lightbulb,
  Globe,
  BookOpen,
} from "lucide-react";

const stats = [
  { label: "Active Students", value: "50,000+", icon: Users },
  { label: "Expert Mentors", value: "500+", icon: GraduationCap },
  { label: "Courses Available", value: "1,200+", icon: BookOpen },
  { label: "Countries Reached", value: "120+", icon: Globe },
];

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description:
      "We believe education should be accessible to everyone, everywhere. Our mission is to democratize learning.",
  },
  {
    icon: Heart,
    title: "Student-First",
    description:
      "Every decision we make puts our students first. Their success is our success.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "We constantly push boundaries to create the most effective and engaging learning experiences.",
  },
  {
    icon: Trophy,
    title: "Excellence",
    description:
      "We partner with industry experts to ensure our courses meet the highest quality standards.",
  },
];

const team = [
  {
    name: "Sarah Johnson",
    role: "CEO & Founder",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
    bio: "Former educator with 15+ years in EdTech",
  },
  {
    name: "Michael Chen",
    role: "CTO",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
    bio: "Tech veteran from leading Silicon Valley companies",
  },
  {
    name: "Emily Rodriguez",
    role: "Head of Content",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop",
    bio: "Curriculum designer passionate about learning",
  },
  {
    name: "David Kim",
    role: "Head of Community",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop",
    bio: "Building connections between learners worldwide",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <Navbar />

      <main className="pt-20">
        {/* ---------------- HERO ---------------- */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-accent/5 to-transparent">
          <div className="absolute inset-0 hero-pattern opacity-40" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                About MentorLMS
              </span>
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
                Empowering Learners{" "}
                <span className="text-gradient">Worldwide</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                We're on a mission to make world-class education accessible to
                everyone. Join thousands of learners transforming their careers
                with our expert-led courses.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ---------------- STATS ---------------- */}
        <section className="py-16 border-y border-border">
          <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl md:text-4xl font-bold">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ---------------- STORY ---------------- */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  MentorLMS was founded in 2020 with a simple belief: everyone
                  deserves access to quality education.
                </p>
                <p>
                  Today, we partner with industry experts to deliver courses that
                  make a real impact.
                </p>
                <p>
                  We're a community of learners and mentors unlocking human
                  potential together.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&fit=crop"
                alt="Team collaboration"
                className="rounded-2xl object-cover shadow-lg"
              />
            </motion.div>
          </div>
        </section>

        {/* ---------------- VALUES (FIXED CARD) ---------------- */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-muted/40 to-transparent">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Our Values
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These principles guide everything we do.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass card-hover p-6 rounded-xl text-center"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <value.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- TEAM ---------------- */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Meet Our Team
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The people behind MentorLMS.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div className="mx-auto mb-4 h-40 w-40 rounded-2xl overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-accent text-sm">{member.role}</p>
                  <p className="text-sm text-muted-foreground">
                    {member.bio}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-accent/20 via-accent/10 to-secondary/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Start Learning?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Transform your career with expert-led courses.
              </p>
              <a
                href="/courses"
                className="btn-cta px-8 py-3 rounded-lg inline-block"
              >
                Browse Courses
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
