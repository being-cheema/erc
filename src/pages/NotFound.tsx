import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Error</p>
        <h1 className="text-7xl font-black text-foreground tracking-tight">404</h1>
        <p className="mt-3 text-sm text-muted-foreground uppercase tracking-wide font-medium">
          Page not found
        </p>
        <Button
          onClick={() => navigate("/")}
          className="mt-8 gradient-primary text-primary-foreground font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
