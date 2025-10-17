import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const UNPROTECTED_PATHS = [
  "/login",
  "/tone",
  "/tone-player",
  "/tone-player/",
  "/tone-player/[id]",
  "/tone-player?id",
  "/tone-player?id=[id]",
  "/register", "/success", "/forgot-password", "/reset-password", "terms", "/privacy-policy", "/cookie-policy", "/plans", "/pricing", "/about", "/contact", "/faq", "/confirm-email", "/"];

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (loading) return; // Aguarda checagem do token
      const isUnprotected = UNPROTECTED_PATHS.some(path => {
        if (path === router.pathname) return true;
        // Permite /tone-player?id=qualquer coisa
        if (path.startsWith("/tone-player") && router.pathname.startsWith("/tone-player")) return true;
        return false;
      });
      if (!isAuthenticated && !isUnprotected) {
        router.replace("/login");
      } else {
        setChecked(true);
      }
    }
  }, [isAuthenticated, loading, router]);

  if (!checked || loading) return null; // Evita hydration mismatch
  return <>{children}</>;
}
