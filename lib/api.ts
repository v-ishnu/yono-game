import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.allyonogamesstore.com/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const admin = localStorage.getItem("admin");
    if (admin) {
      try {
        const parsed = JSON.parse(admin);
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch { }
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("admin");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
