import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { copyLocalToAccount, listLocalScenarios } from "@/lib/mito/scenarios";

export function AccountButton({ onChange }: { onChange: () => void }) {
  const [email, setEmail] = useState<string | null>(null);
  const [localCount, setLocalCount] = useState(0);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const e = data.session?.user.email ?? null;
      setEmail(e);
      if (e && !localStorage.getItem(`cl-copied-${data.session!.user.id}`)) {
        setLocalCount((await listLocalScenarios().catch(() => [])).length);
      } else setLocalCount(0);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      check();
      onChange();
    });
    return () => sub.subscription.unsubscribe();
  }, [onChange]);

  const copy = async () => {
    try {
      const n = await copyLocalToAccount();
      const { data } = await supabase.auth.getSession();
      localStorage.setItem(`cl-copied-${data.session?.user.id}`, "1");
      setLocalCount(0);
      toast.success(`Copied ${n} scenario${n === 1 ? "" : "s"} to your account`);
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Copy failed");
    }
  };
  const dismiss = async () => {
    const { data } = await supabase.auth.getSession();
    localStorage.setItem(`cl-copied-${data.session?.user.id}`, "1");
    setLocalCount(0);
  };

  if (!email)
    return (
      <Button asChild size="sm" variant="outline">
        <Link to="/auth">Sign in to sync scenarios</Link>
      </Button>
    );
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">Saving to {email}</span>
      <Button size="sm" variant="ghost" onClick={() => supabase.auth.signOut()}>
        Sign out
      </Button>
      {localCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
          <span>{localCount} scenario{localCount === 1 ? "" : "s"} in this browser.</span>
          <Button size="sm" onClick={copy}>Copy to account</Button>
          <Button size="sm" variant="ghost" onClick={dismiss}>Not now</Button>
        </div>
      )}
    </div>
  );
}
