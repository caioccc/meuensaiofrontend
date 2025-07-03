import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const UNPROTECTED_PATHS = ["/login", "/register"];

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isUnprotected = UNPROTECTED_PATHS.includes(router.pathname);
      if (!isAuthenticated && !isUnprotected) {
        router.replace("/login");
      } else {
        setChecked(true);
      }
    }
  }, [isAuthenticated, router]);

  if (!checked) return null; // Evita hydration mismatch
  return <>{children}</>;
}
