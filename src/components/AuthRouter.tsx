import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { api } from "@/integrations/supabase/client";

type AuthState = "pending" | "authenticated" | "unauthenticated";

const AuthRouter = () => {
  const [authState, setAuthState] = useState<AuthState>("pending");

  // Validate (and if needed refresh) the token once on mount, so data hooks
  // only run with a genuinely valid session.
  useEffect(() => {
    let cancelled = false;
    api.ensureFreshToken().then((ok) => {
      if (!cancelled) {
        setAuthState(ok ? "authenticated" : "unauthenticated");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // React to logout while mounted
  useEffect(() => {
    const unsubscribe = api.onAuthStateChange((token) => {
      if (!token) setAuthState("unauthenticated");
    });
    return unsubscribe;
  }, []);

  switch (authState) {
    case "pending":
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      );
    case "unauthenticated":
      return <Navigate to="/login" replace />;
    case "authenticated":
      return <Outlet />;
    default: {
      const exhaustive: never = authState;
      return exhaustive;
    }
  }
};

export default AuthRouter;
