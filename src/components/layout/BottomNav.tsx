import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, Trophy, BarChart3, User } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { motion } from "framer-motion";

const navItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/races", icon: Calendar, label: "Races" },
  { path: "/leaderboard", icon: Trophy, label: "Ranks" },
  { path: "/stats", icon: BarChart3, label: "Stats" },
  { path: "/settings", icon: User, label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const { lightImpact } = useHaptics();

  const handleNavTap = () => {
    lightImpact();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-area-inset-bottom">
      <div className="backdrop-blur-xl bg-card/80 border border-white/10 rounded-2xl shadow-lg shadow-black/20 max-w-lg mx-auto">
        <div className="flex items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/home" && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavTap}
                className="relative flex flex-col items-center justify-center flex-1 h-full"
              >
                <div className="relative flex flex-col items-center gap-1">
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute -inset-2 rounded-xl bg-primary/15"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={`relative z-10 w-5 h-5 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative z-10 text-[9px] font-bold uppercase tracking-wide text-primary"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
