import { NavLink as RouterNavLink, type NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps
  extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  /**
   * Show Swiggy-style animated underline
   */
  withIndicator?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  (
    {
      className,
      activeClassName,
      pendingClassName,
      withIndicator = false,
      to,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        {...props}
        className={({ isActive, isPending }) =>
          cn(
            "relative inline-flex items-center transition-colors",
            className,
            isActive && activeClassName,
            isPending && pendingClassName,
          )
        }
      >
        {({ isActive }) => (
          <>
            <span className="relative z-10">{children}</span>

            {withIndicator && isActive && (
              <motion.span
                layoutId="nav-active-indicator"
                className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-accent"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
          </>
        )}
      </RouterNavLink>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
