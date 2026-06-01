import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  allowed: boolean | null; // null = checking
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
      if (s?.user) {
        // defer DB call out of the callback
        setTimeout(() => checkAllowed(), 0);
      } else {
        setAllowed(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
      if (s?.user) checkAllowed();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAllowed = async () => {
    const { data, error } = await supabase.rpc("is_allowed_user");
    if (error) { setAllowed(false); return; }
    setAllowed(!!data);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAllowed(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, allowed, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
