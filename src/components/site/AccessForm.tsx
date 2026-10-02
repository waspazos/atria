"use client";

import { useState, useTransition } from "react";
import { requestAccess } from "@/app/actions";
import { CheckIcon } from "@/components/icons";
import s from "./Site.module.css";

export default function AccessForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <span className={s.sent} role="status">
        <CheckIcon />Thanks. We&rsquo;ll be in touch at {email}.
      </span>
    );
  }

  return (
    <div className={s.formWrap}>
      <form
        className={s.accessForm}
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) return;
          setError(null);
          startTransition(async () => {
            const res = await requestAccess(email);
            if (res.ok) setSent(true);
            else setError(res.error);
          });
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Work email"
          className={s.accessInput}
        />
        <button type="submit" className={s.accessButton} disabled={pending}>
          {pending ? "Sending…" : "Request access"}
        </button>
      </form>
      {error && <span className={s.formError} role="alert">{error}</span>}
    </div>
  );
}
