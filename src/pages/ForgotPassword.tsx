import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !email) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSent(true);
    } catch {
      setError("Network error. Please try again.");
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
            <div className="flex justify-center">
              <img src={logo} alt="Erode Runners Club" className="h-20 w-auto object-contain" />
            </div>

            {sent ? (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Check your email</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We sent a password reset link to <strong className="text-foreground">{email}</strong>.
                  Check your inbox (and spam folder) and click the link to set your password.
                </p>
                <p className="text-xs text-muted-foreground">The link expires in 1 hour.</p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-strava hover:text-strava-dark font-medium transition-colors mt-4"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </motion.div>
            ) : (
              /* Form */
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter your email and we'll send you a link to set your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Email Address
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
                        autoFocus
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
                    disabled={isLoading || !email}
                    className="w-full h-14 text-base font-bold uppercase tracking-wide bg-strava hover:bg-strava-dark text-white rounded-xl disabled:opacity-50 transition-all"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                      />
                    ) : (
                      "Send Reset Link"
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

export default ForgotPassword;
