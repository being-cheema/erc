import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ListErrorState({
  message = "Couldn't load data. Check your connection and try again.",
  onRetry,
}: ListErrorStateProps) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 px-4"
    >
      <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">Something went wrong</h2>
      <p className="text-muted-foreground text-xs font-medium max-w-xs mx-auto">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-4 gap-2">
          <RefreshCw className="w-4 h-4" />
          Try again
        </Button>
      )}
    </motion.div>
  );
}
