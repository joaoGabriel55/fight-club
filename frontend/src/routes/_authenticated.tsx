import {
  createFileRoute,
  redirect,
  Outlet,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { isAuthenticated, markAuthenticated } from "@/shared/lib/api-client";
import { authService } from "@/domains/auth/services/auth.service";
import { NotificationBell } from "@/domains/notifications/components/NotificationBell";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { useAuth } from "@/shared/hooks/useAuth";
import { useMe } from "@/domains/auth/hooks/useMe";
import {
  Swords,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  MessageSquare,
  Menu,
  X,
  LogOut,
  Shield,
  UserCog,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { useState } from "react";
import { GlobalAITipsDialog } from "@/domains/ai/components/GlobalAITipsDialog";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (isAuthenticated()) return;
    try {
      await authService.getMeSilent();
      markAuthenticated();
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { data: user } = useMe();
  const { logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAITipsDialog, setShowAITipsDialog] = useState(false);

  const isTeacher = user?.profile_type === "teacher";
  const isStudent = !isTeacher;

  const handleLogout = async () => {
    await logout();
    router.navigate({ to: "/login" });
  };

  const navLinks = isTeacher
    ? [
        {
          to: "/dashboard" as const,
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        { to: "/classes" as const, label: "Classes", icon: GraduationCap },
        {
          to: "/notifications" as const,
          label: "Notifications",
          icon: MessageSquare,
        },
        { to: "/profile" as const, label: "Profile", icon: UserCog },
        { to: "/privacy" as const, label: "Privacy", icon: Shield },
      ]
    : [
        {
          to: "/dashboard" as const,
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        { to: "/enrollments" as const, label: "My Classes", icon: BookOpen },
        { to: "/feedback" as const, label: "Feedback", icon: MessageSquare },
        {
          to: "/notifications" as const,
          label: "Notifications",
          icon: MessageSquare,
        },
        { to: "/profile" as const, label: "Profile", icon: UserCog },
        { to: "/privacy" as const, label: "Privacy", icon: Shield },
      ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header bar - inspired by UFC/PFL clean top bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Red accent line at top like PFL */}
        <div className="h-0.5 bg-primary" />

        <div className="flex h-14 items-center px-4 max-w-7xl mx-auto">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Brand */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 mr-8 no-underline"
          >
            <Swords className="h-5 w-5 text-primary" />
            <span className="font-black text-lg tracking-tighter uppercase">
              Fight Club
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent no-underline uppercase tracking-wide [&.active]:text-foreground [&.active]:bg-accent"
                activeOptions={{ exact: link.to === "/dashboard" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-1 ml-auto">
            <NotificationBell />
            <ThemeToggle />
            <Separator orientation="vertical" className="mx-1 h-6" />
            <div className="hidden md:flex items-center gap-2">
              {user && (
                <span className="text-sm text-muted-foreground">
                  {user.first_name}
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background pb-4">
            <nav className="flex flex-col px-4 pt-2 gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors no-underline [&.active]:text-foreground [&.active]:bg-accent"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
              <Separator className="my-2" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Page content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </div>

      {/* Global AI Tips Button - Students only */}
      {isStudent && (
        <>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowAITipsDialog(true)}
            className="fixed bottom-6 right-6 z-30 shadow-lg gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Get AI Tips
          </Button>

          {showAITipsDialog && (
            <GlobalAITipsDialog onClose={() => setShowAITipsDialog(false)} />
          )}
        </>
      )}
    </div>
  );
}
