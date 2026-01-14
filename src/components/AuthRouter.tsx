import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";

interface AuthRouterProps {
  children: React.ReactNode;
}

const ONBOARDING_KEY = "erode_runners_onboarding_complete";

const AuthRouter = ({ children }: AuthRouterProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const isOnboardingComplete = () => {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const currentPath = location.pathname;
  const onboardingComplete = isOnboardingComplete();

  // Public routes that don't need redirection logic
  const publicRoutes = ["/auth/callback"];
  if (publicRoutes.includes(currentPath)) {
    return <>{children}</>;
  }

  // First-time user: hasn't completed onboarding
  if (!onboardingComplete) {
    if (currentPath !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }
    return <>{children}</>;
  }

  // Onboarding complete but no session: needs login
  if (onboardingComplete && !session) {
    if (currentPath !== "/login" && currentPath !== "/onboarding") {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  }

  // Onboarding complete and has session: redirect away from auth pages
  if (onboardingComplete && session) {
    if (currentPath === "/onboarding" || currentPath === "/login" || currentPath === "/") {
      return <Navigate to="/home" replace />;
    }
    return <>{children}</>;
  }

  return <>{children}</>;
};

export const markOnboardingComplete = () => {
  localStorage.setItem(ONBOARDING_KEY, "true");
};

export default AuthRouter;
