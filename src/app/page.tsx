import Link from "next/link";
import AccessForm from "@/components/site/AccessForm";
import HeroShot from "@/components/site/HeroShot";
import s from "@/components/site/Site.module.css";
import {
  ArrowRight, AtriaMark, CheckIcon, ClockIcon, DocIcon, DownloadIcon, EyeIcon, LockIcon,
  PageIcon, ReceiptIcon, WatermarkIcon,
} from "@/components/icons";
import { DEMO_LINK_TOKEN } from "@/lib/seed/fixture";

const DEMO_PATH = `/s/${DEMO_LINK_TOKEN}`;

const AddIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <rect x="2" y="2" width="12" height="12" rx="2.5" /><path d="M8 5.5v5M5.5 8h5" />
  </svg>
);

const STEPS = [
  { n: "01", icon: <AddIcon />, title: "Open a space", body: "Create a space for each deal and invite the people who need to be in it. Group spaces under the accounts they belong to.", seller: "Creates the space, sets who can see what.", buyer: "Opens a link. No account to set up." },
  { n: "02", icon: <DocIcon size={18} />, title: "Share and talk", body: "Upload proposals, decks and plans. Emails and calls are summarised into short entries that link back to the source.", seller: "Uploads new versions as the deal moves.", buyer: "Always lands on the current version." },
  { n: "03", icon: <CheckIcon size={18} strokeWidth={1.5} />, title: "Decide together", body: "Ask questions about the deal and get answers that cite the exact document section. Feedback and approvals happen in the same place.", seller: "Sees who viewed what, and when.", buyer: "Gives feedback without hunting through threads." },
];

const STORY = [
  ["Initial outreach", "AUG 26"],
  ["RFP and brief received", "SEP 2"],
  ["First call", "SEP 5"],
  ["Feedback on v2", "SEP 16"],
  ["Proposal v3 shared", "SEP 22"],
  ["Your feedback", "OCT 6"],
] as const;
const STORY_SELECTED = 3;

const SECURITY = [
  { icon: <LockIcon size={16} />, code: "ACC-01", title: "Invite-only spaces", body: "Only people you add can open a space. Email verification confirms it is really them." },
  { icon: <EyeIcon />, code: "DOC-02", title: "Per-document visibility", body: "Keep pricing notes and drafts internal while the client sees only what you choose to share." },
  { icon: <WatermarkIcon />, code: "DOC-03", title: "Watermarked previews", body: "Each page is stamped with the viewer’s email, so shared files stay traceable." },
  { icon: <ClockIcon size={16} strokeWidth={1.5} />, code: "ACC-04", title: "Expiring access", body: "Set an end date and buyer access closes on its own when the deal wraps." },
  { icon: <ReceiptIcon />, code: "LOG-05", title: "View receipts", body: "See who opened each document, how often, and when they last looked." },
  { icon: <DownloadIcon size={16} />, code: "DOC-06", title: "Download controls", body: "Allow or block downloads for the whole space or for a single file." },
];

function storyStyle(i: number) {
  const last = STORY.length - 1;
  const sel = i === STORY_SELECTED;
  const open = i === last;
  return {
    sel,
    open,
    line: open ? "transparent" : i === last - 1 ? "repeating-linear-gradient(180deg,#5c5650 0 4px,transparent 4px 8px)" : i < 3 ? "#4f7f68" : "#3d3934",
    dot: {
      background: sel ? "#8fd1ae" : open ? "transparent" : i < 3 ? "#2f4a3e" : "#35312c",
      color: sel ? "#1f1d1a" : open ? "#8fd1ae" : i < 3 ? "#8fd1ae" : "#8a837a",
      border: open ? "1.5px dashed #8fd1ae" : 0,
      boxShadow: sel ? "0 0 0 5px rgba(143,209,174,.18)" : "none",
    },
    title: { fontWeight: sel ? 600 : 400, color: sel ? "#fff" : open ? "#8fd1ae" : "#c9c1b6" },
    pb: open ? 0 : sel ? 22 : 18,
  };
}

export default function Home() {
  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <a href="#top" className={s.brand}>
          <span className={s.brandMark}><AtriaMark /></span>
          <span className={s.brandName}>atria</span>
        </a>
        <div className={s.navLinks}>
          <a href="#how" className={s.navLink}>How it works</a>
          <a href="#story" className={s.navLink}>Timeline</a>
          <a href="#security" className={s.navLink}>Security</a>
          {/* Seller sign-in arrives with the owner side. */}
          <a href="#access" className={s.signIn}>Sign in</a>
          <a href="#access" className={s.navCta}>Request access</a>
        </div>
      </nav>

      <header id="top" className={s.hero}>
        <div className={s.heroFade} />
        <div className={s.heroInner}>
          <span className={s.badge}><span className={s.pulse} />SHARED DEAL SPACES FOR MEDIA</span>
          <h1 className={s.h1}>Where every deal gathers.</h1>
          <p className={s.lede}>
            Atria gives media sellers and the brands they work with one shared space per deal. Documents, conversations and decisions live together, always on the current version.
          </p>
          <div className={s.ctas}>
            <a href="#access" className={s.ctaPrimary}>Request access<ArrowRight /></a>
            <Link href={DEMO_PATH} className={s.ctaSecondary}>See a live space</Link>
          </div>
        </div>
        <HeroShot src={`${DEMO_PATH}?moment=m_v2_feedback`} label="atria.app/s/arcadia-summer" />
      </header>

      <section id="how" className={s.how}>
        <div className={`${s.container} ${s.howInner}`}>
          <div className={s.howHead}>
            <div className={s.headStack}>
              <span className={s.eyebrow}>02 / HOW IT WORKS</span>
              <h2 className={s.h2}>One link. Both sides of the table.</h2>
            </div>
            <p className={s.howAside}>Sellers run the space. Buyers open a link, with no new login and no app to learn.</p>
          </div>
          <ol className={s.steps}>
            {STEPS.map((step) => (
              <li key={step.n} className={s.step}>
                <div className={s.stepTop}>
                  <span className={s.stepNum}>{step.n}</span>
                  <span className={s.stepIcon}>{step.icon}</span>
                </div>
                <div className={s.stepText}>
                  <h3 className={s.stepTitle}>{step.title}</h3>
                  <p className={s.stepBody}>{step.body}</p>
                </div>
                <div className={s.roles}>
                  <span className={s.role}><span className={s.roleLabel} style={{ color: "#2f7a63" }}>SELLER</span><span>{step.seller}</span></span>
                  <span className={s.role}><span className={s.roleLabel} style={{ color: "#b0603a" }}>BUYER</span><span>{step.buyer}</span></span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="story" className={s.story}>
        <div className={s.storyGrid} />
        <div className={`${s.container} ${s.storyInner}`}>
          <div className={s.storyCopy}>
            <span className={s.eyebrow}>03 / TIMELINE</span>
            <h2 className={s.h2}>Every deal grows a history.</h2>
            <p className={s.storyLede}>
              Calls, emails and new versions become moments on one timeline. Select a moment and the whole space rewinds: documents show the version that was current then, with what changed marked on each one.
            </p>
            <div className={s.storyTags}>
              {["EMAIL", "CALL", "NEW VERSION", "DECISION"].map((t) => <span key={t} className={s.storyTag}>{t}</span>)}
            </div>
          </div>
          <div className={s.figure}>
            <div className={s.figureBar}><span>FIG. 02 · TIMELINE</span><span>SUMMER CREATOR PACKAGE</span></div>
            <ol className={s.storyList}>
              {STORY.map(([title, date], i) => {
                const st = storyStyle(i);
                return (
                  <li key={title} className={s.storyItem} style={{ paddingBottom: st.pb }}>
                    <span className={s.storyLine} style={{ background: st.line }} />
                    <span className={s.storyDot} style={st.dot} />
                    <div className={s.storyText}>
                      <div className={s.storyRow}>
                        <span style={st.title}>{title}</span>
                        <span className={s.storyDate}>{date}</span>
                      </div>
                      {st.sel && (
                        <div className={s.storyCard}>
                          <div className={s.storyCardHead}>
                            <PageIcon size={13} style={{ color: "#2f7a63" }} />Summer Creator Proposal<span className={s.storyVer}>v2 → v3</span>
                          </div>
                          <div className={s.storyChange}><span className={s.changedTag}>CHANGED</span>Tier 1 cut from four creators to three</div>
                          <div className={s.storyChange}><span className={s.changedTag}>CHANGED</span>Flight extended through August</div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      <section id="security" className={s.security}>
        <div className={`${s.container} ${s.securityInner}`}>
          <div className={s.securityHead}>
            <span className={s.eyebrow}>04 / SECURITY AND PERMISSIONS</span>
            <h2 className={s.h2}>Open to the right people. Closed to everyone else.</h2>
          </div>
          <ul className={s.cards}>
            {SECURITY.map((c) => (
              <li key={c.code} className={s.secCard}>
                <div className={s.secTop}>
                  <span className={s.secIcon}>{c.icon}</span>
                  <span className={s.secCode}>{c.code}</span>
                </div>
                <h3 className={s.secTitle}>{c.title}</h3>
                <p className={s.secBody}>{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="access" className={s.access}>
        <div className={s.accessBox}>
          <div className={s.accessGrid} />
          <div className={s.accessCopy}>
            <h2 className={s.accessTitle}>Bring your next deal into Atria.</h2>
            <span className={s.accessSub}>We&rsquo;re onboarding media teams in small groups.</span>
          </div>
          <AccessForm />
        </div>
      </section>

      <footer className={s.footer}>
        <span>ATRIA · 2026</span>
        <div className={s.footerLinks}>
          <a href="#security">SECURITY</a>
          <a href="#access">CONTACT</a>
        </div>
      </footer>
    </div>
  );
}
