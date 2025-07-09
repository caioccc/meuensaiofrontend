import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const UNPROTECTED_PATHS = ["/login", "/register", "/success", "/forgot-password", "/reset-password", "terms", "/privacy-policy", "/cookie-policy", "/plans", "/pricing", "/about", "/contact", "/faq", "/confirm-email"];

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (loading) return; // Aguarda checagem do token
      const isUnprotected = UNPROTECTED_PATHS.includes(router.pathname);
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
