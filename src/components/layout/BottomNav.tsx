import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, Trophy, BarChart3, User } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

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
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset-bottom z-50">
      <div className="flex items-center h-16 max-w-lg mx-auto overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/home" && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavTap}
              className="relative flex flex-col items-center justify-center flex-1 min-w-[52px] h-full"
            >
              <div className="relative flex flex-col items-center">
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
                <item.icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-[9px] mt-1 font-bold uppercase tracking-wide transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
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
