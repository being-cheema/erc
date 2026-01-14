import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting to Strava...");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage("Authorization was denied. Please try again.");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("No authorization code received.");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      try {
        setMessage("Exchanging tokens...");

        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-auth?action=callback&code=${code}`;
        const callbackResponse = await fetch(functionUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await callbackResponse.json();

        if (!callbackResponse.ok || data.error) {
          throw new Error(data.error || "Failed to authenticate");
        }

        setMessage("Signing you in...");

        // Use the token to verify and create session
        if (data.token) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: data.token,
            type: "magiclink",
          });

          if (verifyError) {
            console.error("Verify error:", verifyError);
          }
        }

        setStatus("success");
        setMessage(`Welcome, ${data.athlete?.firstname || "Runner"}!`);
        
        setTimeout(() => navigate("/home"), 1500);
      } catch (err) {
        console.error("Callback error:", err);
        setStatus("error");
        setMessage("Failed to connect. Please try again.");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        {status === "loading" && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto rounded-full border-4 border-primary border-t-transparent"
          />
        )}
        
        {status === "success" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 mx-auto rounded-full bg-green-500 flex items-center justify-center"
          >
            <span className="text-3xl">✓</span>
          </motion.div>
        )}
        
        {status === "error" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto rounded-full bg-destructive flex items-center justify-center"
          >
            <span className="text-3xl">✕</span>
          </motion.div>
        )}

        <p className="text-lg text-foreground">{message}</p>
      </motion.div>
    </div>
  );
};

export default StravaCallback;
