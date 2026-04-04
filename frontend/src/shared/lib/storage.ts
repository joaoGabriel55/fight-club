import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;
const API_BASE = import.meta.env.VITE_API_URL ?? "";

const BUCKET = "avatars";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error(
        "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required",
      );
    }
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabase;
}

function isProduction(): boolean {
  return import.meta.env.PROD;
}

function generateFileName(ext: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `${timestamp}-${random}.${ext}`;
}

/**
 * Resize an image file to a square (cover + center crop) using canvas.
 * Returns a Blob in JPEG format.
 */
export async function resizeImage(file: File, size: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d")!;

  // Cover: scale so the shorter side fills the target, then center-crop
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const scaledW = bitmap.width * scale;
  const scaledH = bitmap.height * scale;
  const offsetX = (size - scaledW) / 2;
  const offsetY = (size - scaledH) / 2;

  ctx.drawImage(bitmap, offsetX, offsetY, scaledW, scaledH);
  bitmap.close();

  return canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
}

/**
 * Upload an avatar image and return its public URL.
 * - Production: uploads to Supabase Storage
 * - Dev/test: saves to frontend public/tmp via a local write
 */
export async function uploadAvatar(file: File): Promise<string> {
  // Resize to 400x400 (LinkedIn profile size)
  const resized = await resizeImage(file, 400);

  if (isProduction()) {
    return uploadToSupabase(resized);
  }
  return uploadToLocal(resized);
}

/**
 * Delete an avatar by its URL.
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  if (isProduction()) {
    return deleteFromSupabase(avatarUrl);
  }
  // Local dev files are just overwritten; no cleanup needed
}

// ── Supabase ──────────────────────────────────────────────────────────────

async function uploadToSupabase(blob: Blob): Promise<string> {
  const supabase = getSupabase();
  const path = `avatars/${generateFileName("jpg")}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

async function deleteFromSupabase(avatarUrl: string): Promise<void> {
  const supabase = getSupabase();
  // Extract path from the public URL
  const match = avatarUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (!match) return;

  const { error } = await supabase.storage.from(BUCKET).remove([match[1]]);
  if (error) {
    throw new Error(`Supabase delete failed: ${error.message}`);
  }
}

// ── Local (dev/test) ────────────────────────────────────────────────────

async function uploadToLocal(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("avatar", blob, "avatar.jpg");

  const response = await fetch(`${API_BASE}/api/v1/dev/avatar-upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Local avatar upload failed");
  }

  const data = await response.json();
  return data.url;
}
