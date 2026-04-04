import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "./shared/lib/query-client";
import { setNavigateFn } from "./shared/lib/api-client";
import { ThemeProvider } from "./shared/components/ThemeProvider";
import { ToastProvider } from "./shared/components/ui/toast";
import "./index.css";

const router = createRouter({
  routeTree,
  context: {},
});

// Wire the api-client's 401 redirect handler to the router
setNavigateFn((path) => router.navigate({ to: path }));

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="dark">
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
