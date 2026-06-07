/**
 * src/lib/support.ts
 *
 * All I/O for the Help & Support form lives here.
 * The form component only calls these two functions and stays dumb.
 *
 * Architecture:
 *   1. uploadSupportFile  → Cloudinary unsigned upload → returns secure_url
 *   2. submitSupportForm  → Google Apps Script Web App → appends Sheet row + sends email
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type IssueType = "Issue" | "Suggestion" | "Other";

export interface SupportFormPayload {
  /** Auto-injected from AuthContext */
  user_id: string;
  user_name: string;
  /** User-editable */
  phone: string;
  email: string;
  issue_types: IssueType[];
  subject: string;
  description: string;
  /** URL returned from Cloudinary after upload. Empty string if no file. */
  doc_url: string;
}

export interface SubmitResult {
  success: boolean;
  error?: string;
}

// ─── Cloudinary File Upload ───────────────────────────────────────────────────

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * Returns the secure public URL on success.
 * Throws on failure so the caller can handle the error.
 */
export async function uploadSupportFile(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env.local"
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "buddy-support-docs");

  const res = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Cloudinary upload failed (${res.status})`);
  }

  const data = await res.json();
  return data.secure_url as string;
}

// ─── Google Apps Script Submission ───────────────────────────────────────────

const WEBHOOK_URL = import.meta.env.VITE_SUPPORT_WEBHOOK_URL as string;

/**
 * Sends the support form payload to the Google Apps Script Web App.
 * The script appends a row to the Google Sheet and sends the notification email.
 *
 * NOTE: Google Apps Script Web Apps do NOT support CORS with credentials.
 * We use `no-cors` mode which means we cannot read the response body.
 * Success is inferred from the fetch not throwing. This is the standard
 * pattern for GAS webhooks from a browser.
 */
export async function submitSupportForm(
  payload: SupportFormPayload
): Promise<SubmitResult> {
  if (!WEBHOOK_URL || WEBHOOK_URL.includes("PASTE_YOUR")) {
    return {
      success: false,
      error:
        "Support webhook is not configured. Set VITE_SUPPORT_WEBHOOK_URL in .env.local",
    };
  }

  // Derive a unique submission ID and ISO timestamp client-side.
  const submission_id = `BUD-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;

  const submitted_at = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());

  const body = {
    submission_id,
    submitted_at,
    ...payload,
    // Google Apps Script expects a plain string for issue_types in the sheet
    issue_types: payload.issue_types.join(", "),
  };

  try {
    // `no-cors` is required for Apps Script Web Apps when called from a browser.
    await fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // `no-cors` responses are always "opaque" — we cannot check res.ok.
    // Any network error would throw above, so reaching here = success.
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Network error. Please try again.";
    return { success: false, error: message };
  }
}
