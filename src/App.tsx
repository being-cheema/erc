import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import StravaCallback from "./pages/StravaCallback";
import Home from "./pages/Home";
import Races from "./pages/Races";
import Stats from "./pages/Stats";
import Leaderboard from "./pages/Leaderboard";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Training from "./pages/Training";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import AppLayout from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<StravaCallback />} />
            <Route element={<AppLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/races" element={<Races />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/training" element={<Training />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
