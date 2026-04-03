import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAnnouncementSchema,
  type CreateAnnouncementInput,
} from "../schemas/announcement.schema";
import { useCreateAnnouncement } from "../hooks/useCreateAnnouncement";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

interface AnnouncementFormProps {
  classId: string;
  onSuccess?: () => void;
}

export function AnnouncementForm({
  classId,
  onSuccess,
}: AnnouncementFormProps) {
  const { mutate: create, isPending, error } = useCreateAnnouncement(classId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAnnouncementInput>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: { title: "", content: "" },
  });

  const onSubmit = (data: CreateAnnouncementInput) => {
    create(data, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">New announcement</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
          noValidate
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="title" className="text-xs">
              Title
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g. Class cancelled this week"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="content" className="text-xs">
              Content
            </Label>
            <Textarea
              id="content"
              rows={3}
              placeholder="Write your announcement..."
              {...register("content")}
            />
            {errors.content && (
              <p className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error.message}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} size="sm">
              {isPending ? "Posting..." : "Post announcement"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
