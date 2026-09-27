import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | Cristae Lab" },
      { name: "description", content: "Sign in to Cristae Lab to keep your mitochondrial scenarios across sessions and devices." },
      { property: "og:title", content: "Sign in | Cristae Lab" },
      { property: "og:description", content: "Save and compare mitochondrial model scenarios in your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message ?? "Google sign in failed");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-6">
        <div>
          <div className="mono-label">Cristae Lab</div>
          <h1 className="text-glow mt-1 text-2xl font-bold">{mode === "in" ? "Sign in" : "Create account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Keep your scenarios across sessions and devices.</p>
        </div>
        {sent ? (
          <p className="text-sm">Check your email to confirm your account, then come back and sign in.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" required minLength={8} placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "in" ? "Sign in" : "Create account"}
            </Button>
          </form>
        )}
        <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
        <div className="flex justify-between text-xs text-muted-foreground">
          <button className="underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setSent(false); }}>
            {mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
          <Link to="/" className="underline">Back to workspace</Link>
        </div>
      </div>
    </div>
  );
}
