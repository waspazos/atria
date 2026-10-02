import Link from "next/link";
import { DEMO_LINK_TOKEN } from "@/lib/seed/fixture";

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "15vh auto", padding: 24 }}>
      <h1>Atria</h1>
      <p>Client-facing deal spaces for media and sponsorship sales.</p>
      <p>
        <Link href={`/s/${DEMO_LINK_TOKEN}`}>Open the demo client space →</Link>
      </p>
    </main>
  );
}
