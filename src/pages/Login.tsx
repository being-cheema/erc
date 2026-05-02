import { motion } from "framer-motion";
import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { isWeb } from "@/utils/platform";

const StravaIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" {...props}>
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
  </svg>
));
StravaIcon.displayName = "StravaIcon";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !email || !password) return;

    setIsLoading(true);
    setError(null);
    setNeedsPasswordSetup(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "no_password_set") {
          setNeedsPasswordSetup(true);
          setError(data.message);
        } else {
          setError(data.error || "Login failed");
        }
        return;
      }

      // Store tokens
      api.setToken(data.token);
      if (data.refresh_token) api.setRefreshToken(data.refresh_token);

      // Navigate based on Strava connection status
      if (data.strava_connected) {
        navigate("/home", { replace: true });
      } else {
        navigate("/connect-strava", { replace: true });
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 safe-area-inset-top">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm mx-auto"
        >
          <div className="glass-card p-8 space-y-8">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center"
            >
              <img src={logo} alt="Erode Runners Club" className="h-24 w-auto object-contain" />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center space-y-3"
            >
              <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
                Run to Live.
              </h1>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Erode Runners Club
              </p>
            </motion.div>

            {/* Login Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              onSubmit={handleLogin}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-background/50 border-border/50 rounded-xl"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-background/50 border-border/50 rounded-xl"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error / Info */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm text-center p-3 rounded-lg ${
                    needsPasswordSetup
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full h-14 text-base font-bold uppercase tracking-wide bg-strava hover:bg-strava-dark text-white rounded-xl disabled:opacity-50 transition-all"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                  />
                ) : (
                  "Log In"
                )}
              </Button>

              <div className="text-center space-y-3">
                <Link
                  to="/forgot-password"
                  className="text-sm text-strava hover:text-strava-dark font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
                {needsPasswordSetup && (
                  <p className="text-xs text-muted-foreground">
                    First time? Click "Forgot Password" above to set up your password.
                  </p>
                )}
                {isWeb() && (
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-strava hover:text-strava-dark font-medium transition-colors">
                      Sign up
                    </Link>
                  </p>
                )}
              </div>
            </motion.form>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="py-6 safe-area-inset-bottom"
      >
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-widest">Powered by</span>
          <div className="flex items-center gap-1 text-strava">
            <StravaIcon />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
