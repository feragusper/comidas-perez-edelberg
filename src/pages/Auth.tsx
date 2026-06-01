import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { session, allowed, signOut } = useAuth();

  useEffect(() => {
    if (session && allowed === true) navigate("/", { replace: true });
  }, [session, allowed, navigate]);

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("No se pudo iniciar sesión. Probá de nuevo.");
      return;
    }
    if (result.redirected) return;
  };

  const blocked = session && allowed === false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="text-4xl mb-3">🍽️</div>
        <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Fraunces, serif" }}>
          Menú de la semana
        </h1>

        {blocked ? (
          <>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              Esta cuenta no tiene acceso. Pedí que te agreguen o entrá con otra cuenta.
            </p>
            <button
              onClick={signOut}
              className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/70 transition-colors"
            >
              Salir e intentar con otra cuenta
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              Acceso privado. Iniciá sesión para continuar.
            </p>
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <GoogleIcon /> Continuar con Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
