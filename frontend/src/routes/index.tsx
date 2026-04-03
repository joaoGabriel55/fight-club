import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tight mb-2">Fight Club</h1>
        <p className="text-gray-400 text-lg">
          Martial arts class management. Privacy-first.
        </p>
      </div>

      <div className="flex gap-4 mt-4">
        <a
          href="/login"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors"
        >
          Log in
        </a>
        <a
          href="/register"
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
        >
          Sign up
        </a>
      </div>
    </div>
  );
}
