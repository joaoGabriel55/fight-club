import { createFileRoute } from "@tanstack/react-router";
import { Swords } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import bgImage from "@/assets/background-image.jpg";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Background image with blur */}
      <div
        className="absolute inset-0 bg-cover bg-center grayscale-50"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col items-center gap-8 p-8 text-center">
        {/* Red accent line */}
        <div className="w-16 h-1 bg-primary rounded-full" />

        <div className="flex flex-col items-center gap-4">
          <Swords className="h-12 w-12 text-primary" />
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-white">
            Fight Club
          </h1>
          <p className="text-lg text-gray-300 max-w-md">
            Martial arts class management. Privacy-first.
          </p>
        </div>

        <div className="flex gap-4 mt-4">
          <Button asChild size="lg">
            <a href="/login">Log in</a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
          >
            <a href="/register">Sign up</a>
          </Button>
        </div>

        {/* Red accent line */}
        <div className="w-16 h-1 bg-primary rounded-full" />
      </div>
    </div>
  );
}
