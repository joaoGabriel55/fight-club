import { createFileRoute, Link } from "@tanstack/react-router";
import { ClassForm } from "@/domains/classes/components/ClassForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export const Route = createFileRoute("/_authenticated/classes/new")({
  component: NewClassPage,
});

function NewClassPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/classes">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to classes
        </Link>
      </Button>
      <h1 className="text-2xl font-bold tracking-tight">Create Class</h1>
      <ClassForm />
    </div>
  );
}
