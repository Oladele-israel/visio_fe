// import axios from "axios";
// import { getAccessToken, setAccessToken } from "./tokenStore";

// const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

// if (!baseURL) {
//   throw new Error("API base URL is not defined");
// }

// export const api = axios.create({
//   baseURL,
//   withCredentials: true,
// });

// export const refreshClient = axios.create({
//   baseURL,
//   withCredentials: true,
// });

// api.interceptors.request.use((config) => {
//   const token = getAccessToken();
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });


// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (!error.response) {
//       return Promise.reject(error);
//     }

//     if (originalRequest._retry) {
//       return Promise.reject(error);
//     }

//     if (error.response.status !== 401) {
//       return Promise.reject(error);
//     }

//     const isRefreshRequest =
//       originalRequest.url?.includes("/auth/refresh");

//     const isAuthRoute =
//       originalRequest.url?.includes("/auth/login") ||
//       originalRequest.url?.includes("/auth/register");

 
//     if (isRefreshRequest) {
//       setAccessToken(null);
//       return Promise.reject(error);
//     }


//     if (isAuthRoute) {
//       return Promise.reject(error);
//     }

//     originalRequest._retry = true;

//     try {
//       const res = await refreshClient.post("/auth/refresh");

//       const newAccessToken = res.data.accessToken;
//       setAccessToken(newAccessToken);

//       originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

//       return api(originalRequest);
//     } catch (refreshError) {
//       setAccessToken(null);

//       if (window.location.pathname !== "/login") {
//         window.location.href = "/login";
//       }

//       return Promise.reject(refreshError);
//     }
//   }
// );

import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',          // Next.js API routes — same origin, no CORS
  withCredentials: true,    // send the better-auth session cookie
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercept 401s globally — redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)