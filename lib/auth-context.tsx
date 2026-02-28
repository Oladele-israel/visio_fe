"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { setAccessToken } from "@/lib/tokenStore";
import { initializeAuth } from "@/lib/authInitializer";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: any) => {
  const router = useRouter(); 

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    boot();
  }, []);

  const boot = async () => {
    const user = await initializeAuth();
    setUser(user);
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      setAccessToken(res.data.authenticated.accessToken);
      setUser(res.data.user);
    } catch (err: any) {
      throw err.response?.data || { message: "Login failed" };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string
  ) => {
    try {
      const res = await api.post("/auth/register", {
        email,
        password,
        name,
        role: "VIEWER",
      });

      setAccessToken(res.data.authenticated.accessToken);
      setUser(res.data.user);
    } catch (err: any) {
      throw err.response?.data || { message: "Login failed" };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed", err);
    }

    setAccessToken(null);
    setUser(null);

    router.replace("/login"); 
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext missing");
  return context;
};