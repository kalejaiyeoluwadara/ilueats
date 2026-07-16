import { apiFetch } from "./client";

export type UploadFolder = "stores" | "banners" | "menu-items";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/** Rejects a file the API would reject anyway, so the admin sees why before
 * waiting on a round-trip. Returns null when the file is fine. */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Choose a JPG, PNG, WebP, or GIF image.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "That image is over 5MB. Try a smaller one.";
  }
  return null;
}

/** Uploads an image and resolves to its hosted URL. */
export async function uploadImage(
  file: File,
  folder: UploadFolder
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await apiFetch<{ url: string }>("/uploads/image", {
    method: "POST",
    body: form,
  });
  return res.url;
}
