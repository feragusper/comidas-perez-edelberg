import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-luxe px-4 relative overflow-hidden">
      {/* Decorative gold glow orbs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-gold/20 blur-3xl animate-float-slow" />
      <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full bg-primary-glow/30 blur-3xl animate-float-slow" style={{ animationDelay: "1.5s" }} />

      <div className="relative w-full max-w-sm">
        {/* Gold ring accent */}
        <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-gold opacity-60 blur-md" />
        <div className="relative rounded-[1.75rem] border border-white/15 bg-card/95 backdrop-blur-xl p-9 text-center shadow-luxe">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-emerald shadow-gold text-3xl">
            🍽️
          </div>

          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-gold mb-2">
            Acceso privado
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">
            Menú de la semana
          </h1>

          {blocked ? (
            <>
              <p className="text-sm text-muted-foreground mt-3 mb-7">
                Esta cuenta no tiene acceso. Pedí que te agreguen o entrá con otra cuenta.
              </p>
              <button
                onClick={signOut}
                className="w-full rounded-lg bg-muted px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/70 transition-colors"
              >
                Salir e intentar con otra cuenta
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mt-3 mb-7">
                Solo para la familia. Iniciá sesión para continuar.
              </p>
              <button
                onClick={handleGoogle}
                className="group w-full flex items-center justify-center gap-2.5 rounded-lg bg-gradient-emerald px-4 py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:opacity-95 transition-all hover:-translate-y-0.5"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                  <GoogleIcon />
                </span>
                Continuar con Google
              </button>
            </>
          )}

          <p className="mt-7 text-[0.7rem] text-muted-foreground/70">
            Pérez · Edelberg
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
