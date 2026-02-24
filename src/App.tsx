import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OfflineScreen from "@/components/OfflineScreen";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AuthRouter from "@/components/AuthRouter";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import AppLayout from "./components/layout/AppLayout";

// Eagerly loaded — first screens users see
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import StravaCallback from "./pages/StravaCallback";

// Lazy loaded — only fetched when user navigates to these routes
const Home = lazy(() => import("./pages/Home"));
const Races = lazy(() => import("./pages/Races"));
const Stats = lazy(() => import("./pages/Stats"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Training = lazy(() => import("./pages/Training"));
const TrainingPlanDetail = lazy(() => import("./pages/TrainingPlanDetail"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Minimal loading spinner for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const AppContent = () => {
  // Handle Capacitor app lifecycle (session refresh on resume)
  useAppLifecycle();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes — no auth required */}
        <Route path="/" element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<StravaCallback />} />

        {/* Protected routes — require authentication */}
        <Route element={<AuthRouter />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/races" element={<Races />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/training" element={<Training />} />
            <Route path="/training/:planId" element={<TrainingPlanDetail />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          {/* Unknown routes for authenticated users */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <OfflineScreen>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </OfflineScreen>
);

export default App;
