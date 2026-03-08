import axios from "axios";

// const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const BASE_URL = "https://swipe-service.onrender.com/api/v1";

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

// On 401, clear auth state and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("swipebuddy_token");
      localStorage.removeItem("swipebuddy_user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
