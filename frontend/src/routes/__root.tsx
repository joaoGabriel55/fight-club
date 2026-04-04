import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <main className="min-h-screen bg-background text-foreground antialiased">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
}
