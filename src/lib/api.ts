import axios from "axios";

// const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const BASE_URL = "http://localhost:5000/api/v1";
// const BASE_URL = "https://swipe-service.onrender.com/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("swipebuddy_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Returns a human-readable message for common HTTP error status codes.
 */
export function getHttpErrorMessage(status: number, serverMessage?: string): string {
  if (serverMessage) return serverMessage;

  switch (status) {
    case 400:
      return "Bad request. Please check your input and try again.";
    case 401:
      return "Your session has expired or credentials are invalid. Please log in again.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource could not be found.";
    case 409:
      return "A conflict occurred. This resource may already exist.";
    case 422:
      return "The data you submitted is invalid. Please review and try again.";
    case 429:
      return "Too many requests. Please slow down and try again in a moment.";
    case 500:
      return "Something went wrong on our end. Please try again later.";
    case 502:
      return "Server is temporarily unreachable (bad gateway). Please try later.";
    case 503:
      return "The service is currently unavailable. Please try again shortly.";
    case 504:
      return "The server took too long to respond. Please try again.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

/**
 * Global response interceptor.
 * On 401: clears auth state WITHOUT hard-reloading the page.
 *   - Auth pages (/login, /) are excluded so that login errors surface properly.
 * On other errors: enriches error with a human-readable message.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status;
    const serverMessage: string | undefined = error.response?.data?.message;

    // Attach a friendly message to the error for consumers to use
    error.friendlyMessage = getHttpErrorMessage(status ?? 0, serverMessage);

    if (status === 401) {
      // Check if the request itself was an auth endpoint (login / signup).
      // If so, do NOT clear auth state – let the calling component handle it.
      const requestUrl: string = error.config?.url ?? "";
      const isAuthEndpoint =
        requestUrl.includes("/auth/login") || requestUrl.includes("/auth/signup");

      if (!isAuthEndpoint) {
        // Clear stored credentials
        localStorage.removeItem("swipebuddy_token");
        localStorage.removeItem("swipebuddy_user");

        // Dispatch a custom event so the app can react (e.g. navigate to login)
        // WITHOUT causing a hard page reload.
        window.dispatchEvent(new CustomEvent("swipebuddy:unauthorized"));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
