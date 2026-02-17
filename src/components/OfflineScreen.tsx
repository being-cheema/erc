import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

/**
 * Detects if the app is offline and shows a full-screen fallback.
 * Only renders the offline UI when there's no network connectivity.
 * Automatically retries when connection is restored.
 */
export const OfflineScreen = ({ children }: { children: React.ReactNode }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground px-6">
      <WifiOff className="w-16 h-16 text-muted-foreground mb-6" />
      <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
        No Internet Connection
      </h1>
      <p className="text-muted-foreground text-center mb-8 max-w-xs">
        Please check your connection and try again. The app will reconnect automatically.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md active:scale-95 transition-transform"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
};

export default OfflineScreen;
