/**
 * Cloudinary unsigned upload utility.
 *
 * Required env vars (in .env.local):
 *   VITE_CLOUDINARY_CLOUD_NAME   – your Cloudinary cloud name
 *   VITE_CLOUDINARY_UPLOAD_PRESET – an *unsigned* upload preset configured in Cloudinary dashboard
 */

const CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string)?.trim();
const UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string)?.trim();

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

/**
 * Upload a single file to Cloudinary using the unsigned upload preset.
 * Returns the full response including `secure_url`.
 */
export async function uploadToCloudinary(
  file: File,
  folder = "swipe-buddy"
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env.local"
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Cloudinary upload failed (${res.status})`);
  }

  return res.json();
}
