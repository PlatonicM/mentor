import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Log as warning or analytics event (not an error)
    console.warn(
      "[404] Route not found:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div
        className="text-center max-w-md w-full"
        role="alert"
        aria-label="Page not found"
      >
        <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>

        <h2 className="text-2xl font-semibold mb-2">
          Page not found
        </h2>

        <p className="text-muted-foreground mb-6">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
