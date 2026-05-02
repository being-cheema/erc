import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { api } from "@/integrations/supabase/client";

const AuthRouter = () => {
  // Check auth synchronously — no useEffect, no state update loop
  const isAuthenticated = !!api.getUser();

  // Subscribe to auth changes so we re-render on login/logout
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = api.onAuthStateChange(() => {
      forceUpdate(n => n + 1);
    });
    return unsubscribe;
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AuthRouter;
