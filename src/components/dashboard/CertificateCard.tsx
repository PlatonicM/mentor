import { motion } from "framer-motion";
import { Award, Download, Calendar, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface CertificateCardProps {
  certificate: {
    id: string;
    certificate_number: string;
    issued_at: string;
    course: {
      id: string;
      title: string;
      thumbnail_url: string | null;
    };
  };
  index: number;
}

export const CertificateCard = ({ certificate, index }: CertificateCardProps) => {
  const { course, certificate_number, issued_at } = certificate;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDownload = () => {
    // In a real implementation, this would generate/download a PDF certificate
    toast({
      title: "Certificate Download",
      description: "Your certificate is being prepared for download...",
    });
    
    // Simulate download - in production, this would call an edge function to generate PDF
    setTimeout(() => {
      toast({
        title: "Download Ready",
        description: `Certificate ${certificate_number} is ready.`,
      });
    }, 1500);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/verify/${certificate_number}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Certificate verification link copied to clipboard.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      <Card variant="gradient" className="overflow-hidden">
        {/* Certificate Header Design */}
        <div className="relative bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 p-6">
          <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
          
          {/* Award Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/20 border border-primary/30">
              <Award className="w-10 h-10 text-primary" />
            </div>
          </div>
          
          {/* Certificate Title */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Certificate of Completion
            </p>
            <h3 className="font-display font-bold text-lg text-foreground line-clamp-2">
              {course.title}
            </h3>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Certificate Details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Certificate ID</span>
              <span className="font-mono text-xs text-foreground">{certificate_number}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Issued Date</span>
              <div className="flex items-center gap-1 text-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(issued_at)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="default"
              className="flex-1"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
