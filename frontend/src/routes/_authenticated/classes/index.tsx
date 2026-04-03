import { createFileRoute, Link } from "@tanstack/react-router";
import { useClasses } from "@/domains/classes/hooks/useClasses";
import { useMe } from "@/domains/auth/hooks/useMe";
import { ClassCard } from "@/domains/classes/components/ClassCard";

export const Route = createFileRoute("/_authenticated/classes/")({
  component: ClassesPage,
});

function ClassesPage() {
  const { data: user } = useMe();
  const { data: classes, isLoading, error } = useClasses();

  if (user?.profile_type === "student") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">
          Classes are only available for teachers.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading classes…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-red-400">Failed to load classes.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">My Classes</h1>
        <Link
          to="/classes/new"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
        >
          Create class
        </Link>
      </div>

      {!classes || classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 px-6 py-12 text-center">
          <p className="text-gray-400 mb-4">You have no classes yet.</p>
          <Link
            to="/classes/new"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
          >
            Create your first class
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {classes.map((cls) => (
            <ClassCard key={cls.id} cls={cls} />
          ))}
        </div>
      )}
    </div>
  );
}
