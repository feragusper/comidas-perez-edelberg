import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isLocalhost } from "@/lib/env";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, allowed } = useAuth();

  // En localhost no hay login posible (el broker OAuth rechaza redirect_uri local):
  // se entra sin sesión para poder mirar la UI. Los datos quedan vacíos por RLS.
  if (isLocalhost() && !session) {
    return <>{children}</>;
  }

  if (loading || (session && allowed === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session || allowed === false) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
