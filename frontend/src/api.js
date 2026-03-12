import axios from "axios";

// VITE_API_URL is set in .env for custom deployments.
// In prod (Vercel) and local dev (Vite proxy), leave it empty — relative /api works.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

// Auto-attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["authorization"] = token;
  }
  return config;
});

export default api;