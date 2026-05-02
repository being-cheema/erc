import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, ChevronRight, ArrowLeft } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setStep(2);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !displayName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            display_name: displayName.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Signup failed");
        if (response.status === 409) {
          // Email taken — go back to step 1
          setStep(1);
        }
        return;
      }

      // Auto-login
      api.setToken(data.token);
      if (data.refresh_token) api.setRefreshToken(data.refresh_token);

      navigate("/connect-strava", { replace: true });
    } catch {
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
          <div className="glass-card p-8 space-y-6">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center"
            >
              <img src={logo} alt="Erode Runners Club" className="h-20 w-auto object-contain" />
            </motion.div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                {step === 1 ? "Create Account" : "Your Details"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {step === 1 ? "Join the Erode Runners Club" : "Tell us about yourself"}
              </p>
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className={`w-8 h-1 rounded-full transition-colors ${step >= 1 ? "bg-strava" : "bg-muted"}`} />
                <div className={`w-8 h-1 rounded-full transition-colors ${step >= 2 ? "bg-strava" : "bg-muted"}`} />
              </div>
            </div>

            {/* Step 1: Email & Password */}
            {step === 1 && (
              <motion.form
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleStep1}
                className="space-y-4"
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
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-background/50 border-border/50 rounded-xl"
                      required
                      minLength={6}
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 bg-background/50 border-border/50 rounded-xl"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-center p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={!email || !password || !confirmPassword}
                  className="w-full h-14 text-base font-bold uppercase tracking-wide bg-strava hover:bg-strava-dark text-white rounded-xl"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </motion.form>
            )}

            {/* Step 2: Name */}
            {step === 2 && (
              <motion.form
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleSignup}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Your Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="How should we call you?"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10 h-12 bg-background/50 border-border/50 rounded-xl"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">This is what appears on the leaderboard</p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-center p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setStep(1); setError(null); }}
                    className="h-14 px-4 rounded-xl border-border/50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !displayName.trim()}
                    className="flex-1 h-14 text-base font-bold uppercase tracking-wide bg-strava hover:bg-strava-dark text-white rounded-xl"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                      />
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </motion.form>
            )}

            {/* Login link */}
            <div className="text-center text-sm text-muted-foreground">
              Already a member?{" "}
              <Link to="/login" className="text-strava hover:text-strava-dark font-medium transition-colors">
                Log in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="py-6 safe-area-inset-bottom text-center"
      >
        <p className="text-xs text-muted-foreground">Erode Runners Club</p>
      </motion.div>
    </div>
  );
};

export default Signup;
