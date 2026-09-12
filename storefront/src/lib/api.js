import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to format errors cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 unauthorized, customer session is not active or has expired
    if (error.response?.status === 401) {
      // Handled gracefully in stores
    }
    return Promise.reject(error);
  }
);

export default api;
