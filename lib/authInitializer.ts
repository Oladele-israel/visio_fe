import { api, refreshClient } from "./api";
import { setAccessToken } from "./tokenStore";

export const initializeAuth = async () => {
  try {
    const refreshRes = await refreshClient.post("/auth/refresh");

    setAccessToken(refreshRes.data.accessToken);

    const userRes = await api.get("/auth/me");
    console.log("this is the user res ====>>", userRes.data)

    return userRes.data;
  } catch {
    setAccessToken(null);
    return null;
  }
};