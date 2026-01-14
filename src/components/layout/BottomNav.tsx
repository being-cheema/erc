import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, BarChart3, Trophy, Settings } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/races", icon: Calendar, label: "Races" },
  { path: "/stats", icon: BarChart3, label: "Stats" },
  { path: "/leaderboard", icon: Trophy, label: "Ranks" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/home" && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-16 h-full"
            >
              <div className="relative flex flex-col items-center">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-1.5 w-10 h-10 rounded-xl gradient-primary opacity-15"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon
                  className={`w-5 h-5 relative z-10 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-[10px] mt-1 transition-colors ${
                    isActive ? "text-primary font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
