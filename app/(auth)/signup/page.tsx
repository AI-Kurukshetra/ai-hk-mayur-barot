"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function SignupPage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"receptionist" | "phlebotomist" | "technician" | "pathologist" | "finance">("receptionist");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const e: Record<string, string> = {};
    if (fullName.trim().length < 2) e.fullName = "Full name must be at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email address.";
    if (password.length < 8) e.password = "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) e.password = "Use uppercase, lowercase, number and special character.";
    if (password !== confirmPassword) e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { full_name: fullName.trim(), role },
      },
    });

    if (signUpError) {
      setFormError(signUpError.message || "Unable to create account. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/login?signup=success");
    router.refresh();
  };

  return (
    <main className="login-wrap">
      <section className="login-card glass-card">
        <div className="login-brand-row"><img src="/microscope-logo.svg" alt="PathologyLab Pro" className="auth-logo" /><div className="login-brand">PathologyLab Pro</div></div>
        <h1>Create account</h1>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <fieldset className={loading ? "form-loading" : ""} disabled={loading}>
            <label>Full Name<input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />{errors.fullName ? <span className="field-error">{errors.fullName}</span> : null}</label>
            <label>Email<input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />{errors.email ? <span className="field-error">{errors.email}</span> : null}</label>
            <label>Role<select value={role} onChange={(e) => setRole(e.target.value as typeof role)}><option value="receptionist">Receptionist</option><option value="phlebotomist">Sample Collection Staff</option><option value="technician">Lab Technician</option><option value="pathologist">Pathologist / Doctor</option><option value="finance">Billing / Accounts</option></select></label>
            <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />{errors.password ? <span className="field-error">{errors.password}</span> : null}</label>
            <label>Confirm Password<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />{errors.confirmPassword ? <span className="field-error">{errors.confirmPassword}</span> : null}</label>
            <button className="button login-btn" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
          </fieldset>
          {loading ? <div className="form-loading-row"><span className="inline-loader" /> <span>Creating account...</span></div> : null}
        </form>

        <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
        {formError ? <p className="auth-error">{formError}</p> : null}
      </section>
    </main>
  );
}
