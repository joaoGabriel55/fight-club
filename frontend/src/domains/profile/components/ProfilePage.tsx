import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { useMe } from "@/domains/auth/hooks/useMe";
import { useUpdateMe } from "@/domains/auth/hooks/useUpdateMe";
import {
  useUploadAvatar,
  useRemoveAvatar,
} from "@/domains/auth/hooks/useAvatar";
import {
  MARTIAL_ARTS,
  BELT_MARTIAL_ARTS,
  BELT_LEVELS,
  COMPETITION_LEVELS,
  type MartialArtExperience,
  type MartialArt,
} from "@/domains/auth/types/auth.types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import {
  Plus,
  Trash2,
  Swords,
  User,
  Ruler,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Camera,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Calendar } from "@/shared/components/ui/calendar";
import { format } from "date-fns/format";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().max(100).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  weight_kg: z.string().optional().or(z.literal("")),
  height_cm: z.string().optional().or(z.literal("")),
  fight_experience: z.array(
    z.object({
      martial_art: z.string().min(1, "Select a martial art"),
      experience_years: z.coerce
        .number()
        .min(0, "Min 0")
        .max(50, "Max 50 years"),
      belt_level: z.string().optional().or(z.literal("")),
      competition_level: z.string().optional().or(z.literal("")),
    }),
  ),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const BELT_COLOR_MAP: Record<string, string> = {
  White: "bg-white text-black border border-border",
  Yellow: "bg-yellow-400 text-yellow-950",
  Red: "bg-red-500 text-white",
  Orange: "bg-orange-500 text-white",
  Green: "bg-green-600 text-white",
  Blue: "bg-blue-600 text-white",
  Purple: "bg-purple-600 text-white",
  Brown: "bg-amber-800 text-white",
  Black: "bg-black text-white border border-border",
};

const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";

export function ProfilePage() {
  const { data: user, isLoading } = useMe();
  const updateMe = useUpdateMe();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dateOpen, setDateOpen] = useState(false);

  const isStudent = user?.profile_type === "student";

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > AVATAR_MAX_SIZE) {
      alert("Image must be under 5 MB");
      return;
    }

    uploadAvatar.mutate(file);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      birth_date: "",
      weight_kg: "",
      height_cm: "",
      fight_experience: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fight_experience",
  });

  useEffect(() => {
    if (!user) return;

    const fightExp: MartialArtExperience[] = isStudent
      ? (user.student_profile?.fight_experience ?? [])
      : (user.teacher_profile?.fight_experience ?? []);

    form.reset({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      birth_date: user.birth_date ?? "",
      weight_kg: user.student_profile?.weight_kg ?? "",
      height_cm: user.student_profile?.height_cm ?? "",
      fight_experience: fightExp.map((exp) => ({
        ...exp,
        belt_level: exp.belt_level ?? "",
        competition_level: exp.competition_level ?? "",
      })),
    });
  }, [user, isStudent, form]);

  const onSubmit = (values: ProfileFormValues) => {
    const payload: Record<string, unknown> = {
      first_name: values.first_name,
      last_name: values.last_name || null,
      birth_date: values.birth_date || null,
      fight_experience: values.fight_experience.length
        ? values.fight_experience.map((exp) => ({
            martial_art: exp.martial_art,
            experience_years: exp.experience_years,
            belt_level: exp.belt_level || null,
            competition_level: exp.competition_level || null,
          }))
        : null,
    };

    if (isStudent) {
      payload.weight_kg = values.weight_kg || null;
      payload.height_cm = values.height_cm || null;
    }

    updateMe.mutate(payload);
  };

  const selectedArts = form.watch("fight_experience").map((f) => f.martial_art);

  const hasBeltSystem = (art: string): boolean =>
    BELT_MARTIAL_ARTS.has(art as MartialArt);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-wrap-balance">
              Fighter Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              {isStudent ? "Student" : "Instructor"} &mdash; manage your info
              and training background
            </p>
          </div>
        </div>
      </div>

      {/* ── Avatar Upload ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            Profile Photo
          </CardTitle>
          <CardDescription>
            Upload a photo (400&times;400px, max 5 MB). JPEG, PNG, or WebP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Avatar preview */}
            <div className="relative group">
              <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.first_name}'s profile photo`}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User
                    className="h-10 w-10 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </div>
              {user?.avatar_url && (
                <button
                  type="button"
                  onClick={() => removeAvatar.mutate(user.avatar_url!)}
                  disabled={removeAvatar.isPending}
                  aria-label="Remove profile photo"
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Upload controls */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={AVATAR_ACCEPT}
                onChange={handleAvatarSelect}
                className="sr-only"
                id="avatar-upload"
                aria-label="Upload profile photo"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
              >
                <Camera className="h-4 w-4 mr-2" aria-hidden="true" />
                {uploadAvatar.isPending ? "Uploading" : "Upload Photo"}
              </Button>
              <div aria-live="polite" className="text-xs">
                {uploadAvatar.isSuccess && (
                  <span className="text-green-600 dark:text-green-400">
                    Photo updated
                  </span>
                )}
                {uploadAvatar.isError && (
                  <span className="text-destructive">
                    Upload failed &mdash; check file size and format
                  </span>
                )}
                {removeAvatar.isSuccess && (
                  <span className="text-green-600 dark:text-green-400">
                    Photo removed
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Personal Information ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  autoComplete="given-name"
                  spellCheck={false}
                  {...form.register("first_name")}
                />
                {form.formState.errors.first_name && (
                  <p className="text-sm text-destructive" role="alert">
                    {form.formState.errors.first_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  autoComplete="family-name"
                  spellCheck={false}
                  {...form.register("last_name")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Date of Birth</Label>
              <Controller
                control={form.control}
                name="birth_date"
                render={({ field: dateField }) => (
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="birth_date"
                        className="w-full justify-start font-normal"
                      >
                        {dateField.value
                          ? new Date(dateField.value).toLocaleDateString()
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={
                          dateField.value
                            ? new Date(dateField.value)
                            : undefined
                        }
                        defaultMonth={
                          dateField.value
                            ? new Date(dateField.value)
                            : new Date(new Date().getFullYear() - 18, 0)
                        }
                        captionLayout="dropdown"
                        disabled={(date) => date > new Date()}
                        onSelect={(date) => {
                          dateField.onChange(
                            date ? format(date, "yyyy-MM-dd") : "",
                          );
                          setDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_display">Email</Label>
              <Input
                id="email_display"
                value={user?.email ?? ""}
                disabled
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Physical Information (Student only) ── */}
        {isStudent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ruler
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                Physical Information
              </CardTitle>
              <CardDescription>
                Used for weight-class matching and safety
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 75.5"
                    autoComplete="off"
                    {...form.register("weight_kg")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height_cm">Height (cm)</Label>
                  <Input
                    id="height_cm"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 180"
                    autoComplete="off"
                    {...form.register("height_cm")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Martial Arts Experience ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Swords
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              Martial Arts Experience
            </CardTitle>
            <CardDescription>
              Add each discipline you train, your level, and competition status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <Swords
                  className="mx-auto h-8 w-8 text-muted-foreground/50"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  No disciplines added yet. Add your first martial art below.
                </p>
              </div>
            )}

            {fields.map((field, index) => {
              const currentArt = form.watch(
                `fight_experience.${index}.martial_art`,
              );
              const showBelt = hasBeltSystem(currentArt);
              const currentBelt = form.watch(
                `fight_experience.${index}.belt_level`,
              );

              return (
                <div
                  key={field.id}
                  className="relative rounded-lg border bg-card p-4 space-y-4 transition-colors hover:border-primary/30"
                >
                  {/* Row header with index badge and delete */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {String(index + 1).padStart(2, "0")}
                      </Badge>
                      {currentArt && (
                        <span className="text-sm font-medium">
                          {currentArt}
                        </span>
                      )}
                      {currentBelt && showBelt && (
                        <Badge
                          className={`text-xs ${BELT_COLOR_MAP[currentBelt] ?? "bg-muted"}`}
                        >
                          {currentBelt} Belt
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      aria-label={`Remove ${currentArt || "martial art"} entry`}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>

                  <Separator />

                  {/* Martial art + Years */}
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`fight_experience.${index}.martial_art`}>
                        Discipline
                      </Label>
                      <Select
                        value={currentArt}
                        onValueChange={(value) =>
                          form.setValue(
                            `fight_experience.${index}.martial_art`,
                            value,
                            { shouldValidate: true },
                          )
                        }
                      >
                        <SelectTrigger
                          id={`fight_experience.${index}.martial_art`}
                        >
                          <SelectValue placeholder="Select discipline" />
                        </SelectTrigger>
                        <SelectContent>
                          {MARTIAL_ARTS.map((art) => (
                            <SelectItem
                              key={art}
                              value={art}
                              disabled={
                                selectedArts.includes(art) && currentArt !== art
                              }
                            >
                              {art}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.fight_experience?.[index]
                        ?.martial_art && (
                        <p className="text-sm text-destructive" role="alert">
                          {
                            form.formState.errors.fight_experience[index]
                              .martial_art?.message
                          }
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`fight_experience.${index}.experience_years`}
                      >
                        Years
                      </Label>
                      <Input
                        id={`fight_experience.${index}.experience_years`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={50}
                        autoComplete="off"
                        {...form.register(
                          `fight_experience.${index}.experience_years`,
                        )}
                      />
                    </div>
                  </div>

                  {/* Belt level + Competition level */}
                  <div
                    className={`grid gap-4 ${showBelt ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}
                  >
                    {/* Belt level — only for belt-based arts */}
                    {showBelt && (
                      <div className="space-y-2">
                        <Label htmlFor={`fight_experience.${index}.belt_level`}>
                          Belt Level
                        </Label>
                        <Select
                          value={currentBelt || ""}
                          onValueChange={(value) =>
                            form.setValue(
                              `fight_experience.${index}.belt_level`,
                              value,
                              { shouldValidate: true },
                            )
                          }
                        >
                          <SelectTrigger
                            id={`fight_experience.${index}.belt_level`}
                          >
                            <SelectValue placeholder="Select belt" />
                          </SelectTrigger>
                          <SelectContent>
                            {BELT_LEVELS.map((belt) => (
                              <SelectItem key={belt} value={belt}>
                                <span className="flex items-center gap-2">
                                  <span
                                    className={`inline-block h-3 w-3 rounded-full ${BELT_COLOR_MAP[belt] ?? ""}`}
                                    aria-hidden="true"
                                  />
                                  {belt}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Competition level */}
                    <div className="grid">
                      <Label
                        htmlFor={`fight_experience.${index}.competition_level`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Trophy
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                          Competition Level
                        </span>
                        {/*Competition Level*/}
                      </Label>
                      <Select
                        value={
                          form.watch(
                            `fight_experience.${index}.competition_level`,
                          ) || ""
                        }
                        onValueChange={(value) =>
                          form.setValue(
                            `fight_experience.${index}.competition_level`,
                            value,
                            { shouldValidate: true },
                          )
                        }
                      >
                        <SelectTrigger
                          id={`fight_experience.${index}.competition_level`}
                        >
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPETITION_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}

            {fields.length < MARTIAL_ARTS.length && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    martial_art: "",
                    experience_years: 0,
                    belt_level: "",
                    competition_level: "",
                  })
                }
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Add Martial Art
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── Submit ── */}
        <div className="flex items-center justify-between">
          <div aria-live="polite" className="text-sm">
            {updateMe.isSuccess && (
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Profile saved
              </span>
            )}
            {updateMe.isError && (
              <span className="flex items-center gap-1.5 text-destructive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                Save failed &mdash; please try again
              </span>
            )}
          </div>

          <Button type="submit" disabled={updateMe.isPending}>
            {updateMe.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
