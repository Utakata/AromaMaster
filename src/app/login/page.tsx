"use client";

import { useState } from "react";
import { Button, Card, Field, Notice, PageTitle, inputClass } from "@/components/ui";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const supabase = getBrowserSupabase();

  if (!supabase) {
    return <Notice>ログイン機能は現在利用できません。データはこの端末に保存されます。</Notice>;
  }

  return (
    <div className="space-y-5">
      <PageTitle title="ログイン" lead="メールアドレスにログイン用リンクを送ります。パスワードは不要です。" />
      <Card>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await supabase.auth.signInWithOtp({
              email,
              options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/settings` },
            });
            setState(error ? { tone: "danger", text: error.message } : { tone: "success", text: "メールを送りました。リンクを開いてログインしてください。" });
          }}
        >
          <Field label="メールアドレス">
            <input type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Button type="submit">ログインリンクを送る</Button>
          {state && <Notice tone={state.tone}>{state.text}</Notice>}
        </form>
      </Card>
    </div>
  );
}
