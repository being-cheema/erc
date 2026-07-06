import { QueryClient } from "@tanstack/react-query";

// Shared QueryClient instance so non-component code (e.g. useAppLifecycle's
// session-expiry path) can clear the cache before a hard redirect.
export const queryClient = new QueryClient();
