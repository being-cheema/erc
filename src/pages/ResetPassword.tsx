import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { Link, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="glass-card p-8 text-center space-y-4 max-w-sm w-full">
          <h2 className="text-xl font-bold text-foreground">Invalid Link</h2>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-strava hover:text-strava-dark font-medium transition-colors"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

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
            <div className="flex justify-center">
              <img src={logo} alt="Erode Runners Club" className="h-20 w-auto object-contain" />
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Password Set!</h2>
                <p className="text-sm text-muted-foreground">
                  Your password has been set successfully. You can now log in.
                </p>
                <Link
                  to="/login"
                  className="inline-block mt-4 bg-strava hover:bg-strava-dark text-white font-bold uppercase tracking-wide px-8 py-3 rounded-xl transition-all"
                >
                  Go to Login
                </Link>
              </motion.div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Set Password</h2>
                  <p className="text-sm text-muted-foreground">
                    Create a new password for your account.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 bg-background/50 border-border/50 rounded-xl"
                        required
                        minLength={6}
                        autoFocus
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
                        type={showPassword ? "text" : "password"}
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 h-12 bg-background/50 border-border/50 rounded-xl"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-center text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || !password || !confirmPassword}
                    className="w-full h-14 text-base font-bold uppercase tracking-wide bg-strava hover:bg-strava-dark text-white rounded-xl disabled:opacity-50 transition-all"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                      />
                    ) : (
                      "Set Password"
                    )}
                  </Button>

                  <div className="text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
