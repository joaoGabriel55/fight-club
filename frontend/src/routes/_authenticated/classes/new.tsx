import { createFileRoute, Link } from "@tanstack/react-router";
import { ClassForm } from "@/domains/classes/components/ClassForm";

export const Route = createFileRoute("/_authenticated/classes/new")({
  component: NewClassPage,
});

function NewClassPage() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/classes"
          className="text-sm text-gray-400 hover:text-gray-200 transition"
        >
          ← Back to classes
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Create class</h1>
      <ClassForm />
    </div>
  );
}
