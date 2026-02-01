import type { MouseEvent } from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  isWishlisted: boolean;
  onToggle: () => void;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "ghost" | "outline" | "default";
  className?: string;
  showLabel?: boolean;
}

export function WishlistButton({
  isWishlisted,
  onToggle,
  size = "icon",
  variant = "ghost",
  className,
  showLabel = false,
}: WishlistButtonProps) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      aria-label={
        isWishlisted ? "Remove from wishlist" : "Add to wishlist"
      }
      aria-pressed={isWishlisted}
      className={cn(
        "relative transition-colors",
        isWishlisted
          ? "text-red-500 hover:text-red-600"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <motion.span
        animate={
          isWishlisted
            ? { scale: [1, 1.25, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex items-center"
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-all",
            isWishlisted && "fill-current",
          )}
        />
      </motion.span>

      {showLabel && (
        <motion.span
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="ml-2 text-sm"
        >
          {isWishlisted ? "Saved" : "Save"}
        </motion.span>
      )}
    </Button>
  );
}
