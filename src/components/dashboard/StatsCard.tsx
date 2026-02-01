import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color?: "primary" | "secondary" | "accent";
}

export const StatsCard = ({ icon: Icon, label, value, color = "primary" }: StatsCardProps) => {
  const colorClasses = {
    primary: "text-primary bg-primary/10",
    secondary: "text-secondary bg-secondary/10",
    accent: "text-accent bg-accent/10",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card variant="glass" className="p-4 md:p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>
            <p className="text-xs md:text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
