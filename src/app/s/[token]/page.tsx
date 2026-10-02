import type { Metadata } from "next";
import ClientSpace from "@/components/client-space/ClientSpace";
import { getClientSpaceByToken } from "@/lib/data/client-space";

export const metadata: Metadata = { title: "Deal space · Atria", robots: { index: false } };

const MESSAGES = {
  not_found: ["This link doesn't work", "Check the link you were sent, or ask your contact for a new one."],
  expired: ["This link has expired", "Ask your contact to send you a fresh link."],
  revoked: ["You no longer have access", "Access to this space was removed. Contact the team if this is unexpected."],
  verify_email: ["Confirm your email", "Email verification is coming soon."],
} as const;

export default async function ClientSpacePage(props: PageProps<"/s/[token]">) {
  const { token } = await props.params;
  const { moment } = await props.searchParams;
  const result = await getClientSpaceByToken(token);

  if (result.status !== "ok") {
    const [title, body] = MESSAGES[result.status];
    return (
      <main style={{ maxWidth: 480, margin: "20vh auto", padding: 24, textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 34 }}>{title}</h1>
        <p style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}>{body}</p>
      </main>
    );
  }

  return (
    <ClientSpace
      view={result.view}
      token={token}
      initialMomentId={typeof moment === "string" ? moment : undefined}
    />
  );
}
