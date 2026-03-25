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
    console.error("Cloudinary Configuration Error:", { cloudName: CLOUD_NAME, uploadPreset: UPLOAD_PRESET });
    throw new Error(
      "Cloudinary is not configured correctly. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your environment settings (like Vercel dashboard)."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  console.log(`Uploading to Cloudinary [Cloud: ${CLOUD_NAME}, Preset: ${UPLOAD_PRESET}]...`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Cloudinary request failed:", {
      status: res.status,
      statusText: res.statusText,
      errorData: err,
      debug: { cloudName: CLOUD_NAME, uploadPreset: UPLOAD_PRESET }
    });
    
    // Provide a very clear error message for common issues
    if (err?.error?.message?.includes("Upload preset not found")) {
      throw new Error(`Cloudinary error: Preset '${UPLOAD_PRESET}' not found for Cloud '${CLOUD_NAME}'. Verify these names match your Cloudinary dashboard exactly!`);
    }

    throw new Error(err?.error?.message || `Cloudinary upload failed (${res.status})`);
  }

  return res.json();
}
