import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: (failureCount, error) => {
        // Do not retry on 401/403/404 — these are not transient
        if (error instanceof Error && "status" in error) {
          const status = (error as any).status as number;
          if ([401, 403, 404].includes(status)) return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
