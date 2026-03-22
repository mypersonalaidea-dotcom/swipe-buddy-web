/**
 * ============================================================
 * 📱 2Factor.in SMS OTP Service
 * ============================================================
 *
 * Integrates with 2Factor.in REST API for:
 *  - Sending OTP via SMS (auto-generated 6-digit code)
 *  - Verifying OTP entered by the user
 *
 * API Reference:
 *  Send:   GET https://2factor.in/API/V1/{key}/SMS/{phone}/AUTOGEN/{template}
 *  Verify: GET https://2factor.in/API/V1/{key}/SMS/VERIFY/{session}/{otp}
 *
 * Environment:
 *  VITE_2FACTOR_API_KEY  — your 2Factor.in API key
 *
 * The template name is optional; if you registered an OTP
 * template on the 2Factor dashboard, pass it as VITE_2FACTOR_TEMPLATE_NAME.
 * ============================================================
 */

const TWO_FACTOR_BASE = 'https://2factor.in/API/V1';

function getApiKey(): string {
  const key = import.meta.env.VITE_2FACTOR_API_KEY as string | undefined;
  if (!key) {
    throw new Error(
      '[2Factor] Missing VITE_2FACTOR_API_KEY in .env.local.\n' +
      'Get your API key from https://2factor.in → My Account → API Key',
    );
  }
  return key;
}

function getTemplateName(): string | undefined {
  return (import.meta.env.VITE_2FACTOR_TEMPLATE_NAME as string | undefined) || undefined;
}

/** Response shape from 2Factor.in */
interface TwoFactorResponse {
  Status: 'Success' | 'Error';
  Details: string;            // session_id on send, "OTP Matched" / "OTP Expired" etc. on verify
}

/**
 * Send an OTP to the given phone number.
 *
 * @param phone - 10-digit Indian mobile number (without country code)
 * @returns The session_id needed for verifying the OTP later
 * @throws Error if the API call fails or returns an error status
 */
export async function sendOtp(phone: string): Promise<string> {
  const apiKey = getApiKey();
  const templateName = getTemplateName();

  // Build the URL: /API/V1/{key}/SMS/{phone}/AUTOGEN[/{template}]
  let url = `${TWO_FACTOR_BASE}/${apiKey}/SMS/${phone}/AUTOGEN`;
  if (templateName) {
    url += `/${encodeURIComponent(templateName)}`;
  }

  const res = await fetch(url, { method: 'GET' });

  if (!res.ok) {
    throw new Error(`[2Factor] HTTP ${res.status}: Failed to send OTP`);
  }

  const data: TwoFactorResponse = await res.json();

  if (data.Status !== 'Success') {
    throw new Error(`[2Factor] Send failed: ${data.Details}`);
  }

  // data.Details contains the session_id
  return data.Details;
}

/**
 * Verify the OTP entered by the user.
 *
 * @param sessionId - The session_id returned by sendOtp()
 * @param otp       - The OTP code entered by the user
 * @returns true if OTP is valid, false if it's wrong/expired
 * @throws Error if the API call itself fails (network error, etc.)
 */
export async function verifyOtp(sessionId: string, otp: string): Promise<boolean> {
  const apiKey = getApiKey();

  const url = `${TWO_FACTOR_BASE}/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;

  const res = await fetch(url, { method: 'GET' });

  if (!res.ok) {
    // 2Factor returns 4xx for invalid OTP scenarios
    if (res.status === 400) {
      return false;
    }
    throw new Error(`[2Factor] HTTP ${res.status}: Failed to verify OTP`);
  }

  const data: TwoFactorResponse = await res.json();

  if (data.Status === 'Success' && data.Details === 'OTP Matched') {
    return true;
  }

  // OTP Expired, OTP Mismatched, etc.
  return false;
}
