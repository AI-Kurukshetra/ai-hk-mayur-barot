"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const signupSuccess = params.get("signup") === "success";

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const next: Record<string, string> = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Please enter a valid email address.";
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setFormError(signInError.message || "Unable to sign in. Please verify your credentials.");
      setLoading(false);
      return;
    }

    router.push("/overview");
    router.refresh();
  };

  return (
    <main className="login-wrap">
      <section className="login-card glass-card">
        <div className="login-brand-row"><img src="/laboratory-microscope-icon.svg" alt="PathologyLab Pro" className="auth-logo" /><div className="login-brand">PathologyLab Pro</div></div>
        <h1>Sign in</h1>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <fieldset className={loading ? "form-loading" : ""} disabled={loading}>
            <label>Email<input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />{errors.email ? <span className="field-error">{errors.email}</span> : null}</label>
            <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />{errors.password ? <span className="field-error">{errors.password}</span> : null}</label>
            <button className="button login-btn" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
          </fieldset>
          {loading ? <div className="form-loading-row"><span className="inline-loader" /> <span>Validating credentials...</span></div> : null}
        </form>

        <p className="auth-switch">New user? <Link href="/signup">Create account</Link></p>
        {signupSuccess ? <p className="auth-success">Account created. Please sign in.</p> : null}
        {formError ? <p className="auth-error">{formError}</p> : null}
      </section>
    </main>
  );
}
