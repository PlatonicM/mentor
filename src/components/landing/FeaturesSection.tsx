import { motion } from "framer-motion";
import { 
  MonitorPlay, 
  Users, 
  Award, 
  Clock, 
  Smartphone, 
  ShieldCheck,
  Zap,
  Globe
} from "lucide-react";

const features = [
  {
    icon: MonitorPlay,
    title: "HD Video Streaming",
    description: "Crystal-clear video lessons with adaptive quality for any connection speed.",
    color: "from-primary to-secondary",
  },
  {
    icon: Users,
    title: "Expert Mentors",
    description: "Learn from industry professionals with real-world experience.",
    color: "from-accent to-success",
  },
  {
    icon: Award,
    title: "Verified Certificates",
    description: "Earn industry-recognized certificates to boost your career.",
    color: "from-destructive to-warning",
  },
  {
    icon: Clock,
    title: "Learn at Your Pace",
    description: "Access courses anytime, anywhere. Lifetime access included.",
    color: "from-info to-primary",
  },
  {
    icon: Smartphone,
    title: "Mobile Learning",
    description: "Learn on the go with our responsive platform and mobile app.",
    color: "from-secondary to-accent",
  },
  {
    icon: ShieldCheck,
    title: "Secure Platform",
    description: "Your data is protected with enterprise-grade security.",
    color: "from-success to-accent",
  },
  {
    icon: Zap,
    title: "Interactive Quizzes",
    description: "Test your knowledge with engaging quizzes and assessments.",
    color: "from-warning to-destructive",
  },
  {
    icon: Globe,
    title: "Global Community",
    description: "Join millions of learners from around the world.",
    color: "from-primary to-info",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 hero-pattern opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Why Choose <span className="text-gradient">MentorLMS?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to accelerate your learning journey and achieve your career goals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group"
            >
              <div className="card-gradient rounded-2xl p-6 h-full border border-border/50 card-hover">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-background" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
