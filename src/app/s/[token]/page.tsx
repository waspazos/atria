import type { Metadata } from "next";
import { getClientSpaceByToken } from "@/lib/data/client-space";

export const metadata: Metadata = { robots: { index: false } };

const MESSAGES = {
  not_found: ["This link doesn't work", "Check the link you were sent, or ask your contact for a new one."],
  expired: ["This link has expired", "Ask your contact to send you a fresh link."],
  revoked: ["You no longer have access", "Access to this space was removed. Contact the team if this is unexpected."],
  verify_email: ["Confirm your email", "Email verification is coming soon."],
} as const;

export default async function ClientSpacePage(props: PageProps<"/s/[token]">) {
  const { token } = await props.params;
  const result = await getClientSpaceByToken(token);

  if (result.status !== "ok") {
    const [title, body] = MESSAGES[result.status];
    return (
      <main style={{ maxWidth: 480, margin: "20vh auto", padding: 24, textAlign: "center" }}>
        <h1>{title}</h1>
        <p style={{ color: "var(--ink-muted)" }}>{body}</p>
      </main>
    );
  }

  // Placeholder until the client space UI is built from the Claude Design file.
  const { account, deal, space, documents, moments } = result.view;
  return (
    <main style={{ maxWidth: 960, margin: "48px auto", padding: 24 }}>
      <p style={{ color: "var(--ink-muted)" }}>{account.name}</p>
      <h1>{deal.name}</h1>
      <p>{space.statusLabel}</p>
      <p>{documents.length} documents · {moments.length} timeline moments</p>
    </main>
  );
}
