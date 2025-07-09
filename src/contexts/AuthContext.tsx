/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/axios";

interface Plan {
  id: number;
  name: string;
  features: Record<string, any>;
}
interface Subscription {
  id: number;
  plan: Plan;
  is_active: boolean;
  status: string;
}
interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  active_subscription?: Subscription | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isPro: boolean;
  subscription: Subscription | null;
  login: (access: string, refresh: string) => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const router = useRouter();

  useEffect(() => {
    const access = localStorage.getItem("access");
    if (access) {
      api
        .get("users/me/", { headers: { Authorization: `Bearer ${access}` } })
        .then((res) => {
          setUser(res.data);
          setIsAuthenticated(true);
          const sub = res.data.active_subscription;
          setSubscription(sub);
          console.log("Active subscription:", sub);
          setIsPro(!!(sub && sub.is_active && sub.status === 'active' && sub.plan && sub.plan.features && sub.plan.features.pro));
        })
        .catch(() => {
          setUser(null);
          setIsAuthenticated(false);
          setIsPro(false);
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setIsPro(false);
    }
  }, []);

  const login = (access: string, refresh: string) => {
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    setIsAuthenticated(true);
    setLoading(true);
    api
      .get("users/me/", { headers: { Authorization: `Bearer ${access}` } })
      .then((res) => {
        setUser(res.data);
        const sub = res.data.active_subscription;
        console.log("Active subscription:", sub);
        setIsPro(!!(sub && sub.is_active && sub.status === 'active' && sub.plan && sub.plan.features && sub.plan.features.pro));
        setSubscription(sub);
      }).finally(() => setLoading(false));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsPro(false);
    setSubscription(null);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    router.push("/login");
  };

  const refreshUser = () => {
    const access = localStorage.getItem("access");
    if (access) {
      api
        .get("users/me/", { headers: { Authorization: `Bearer ${access}` } })
        .then((res) => {
          setUser(res.data);
          const sub = res.data.active_subscription;
          console.log("Active subscription:", sub);
          setSubscription(sub);
          setIsPro(!!(sub && sub.is_active && sub.status === 'active' && sub.plan && sub.plan.features && sub.plan.features.pro));
        })
        .catch(() => {
          setUser(null);
          setIsAuthenticated(false);
          setIsPro(false);
          setSubscription(null);
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          router.push("/login");
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, isPro, subscription, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
