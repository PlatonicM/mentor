import { Button } from "@/components/ui/button";
import { Twitter, Facebook, Share2 } from "lucide-react";
import { motion } from "framer-motion";

interface ShareButtonsProps {
  title: string;
  url?: string;
  className?: string;
}

export function ShareButtons({
  title,
  url,
  className = "",
}: ShareButtonsProps) {
  const shareUrl =
    url ??
    (typeof window !== "undefined" ? window.location.href : "");

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  const handleShare = async (platform?: keyof typeof shareLinks) => {
    // Native mobile share (Swiggy-style)
    if (navigator.share && !platform) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to manual share
      }
    }

    if (!platform) return;

    window.open(
      shareLinks[platform],
      "_blank",
      "noopener,noreferrer,width=600,height=500",
    );
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm text-muted-foreground">Share</span>

      {/* Native Share (Mobile-first) */}
      <motion.div whileTap={{ scale: 0.9 }}>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => handleShare()}
          aria-label="Share"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Twitter */}
      <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full hover:text-sky-500"
          onClick={() => handleShare("twitter")}
          aria-label="Share on Twitter"
        >
          <Twitter className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Facebook */}
      <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full hover:text-blue-600"
          onClick={() => handleShare("facebook")}
          aria-label="Share on Facebook"
        >
          <Facebook className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}
