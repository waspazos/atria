"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatAnswer } from "@/lib/chat/answer";
import type {
  ChangeKind,
  ClientSpaceView,
  DocumentKind,
  MomentKind,
  Person,
  Presence,
  Side,
  TimelineMoment,
} from "@/lib/domain/types";
import {
  correspondenceFor,
  documentsAsOf,
  documentsTouched,
  generalNotes,
  latestVersion,
  sortMoments,
  asOfDate,
} from "@/lib/domain/timeline";
import { dateRange, initials, shortDate } from "@/lib/format";
import {
  ArrowUpRight, CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, ClockIcon, CloseIcon,
  DocIcon, DownloadIcon, FlagIcon, GridIcon, LayersIcon, LockIcon, MailIcon, PageIcon, PhoneIcon,
  PinIcon, PlusIcon, ResetIcon, SendIcon, SheetIcon, SlidesIcon, SparkleIcon, TimelineIcon,
} from "@/components/icons";
import s from "./ClientSpace.module.css";

// ─── Design tokens for state colours ────────────────────────────────────────

const TAG: Record<ChangeKind, { label: string; bg: string; color: string }> = {
  new: { label: "New", bg: "#2f7a63", color: "#ffffff" },
  decided: { label: "Decided", bg: "#e7f0eb", color: "#2f7a63" },
  changed: { label: "Changed", bg: "#f6e4d8", color: "#b0603a" },
  next: { label: "Next", bg: "#ece7df", color: "#5a544c" },
  asked: { label: "Asked", bg: "#e8e6ef", color: "#5e5a7a" },
};

const TYPE_TINT: Record<DocumentKind, [string, string]> = {
  doc: ["#e7f0eb", "#2f7a63"],
  slides: ["#f6e4d8", "#b0603a"],
  sheet: ["#e4ece9", "#3d6f62"],
};

const LINE_REACHED = "#9cc3b2";
const LINE_FUTURE = "#e0d9cf";
const DASHED = "repeating-linear-gradient(180deg,#cfc7bb 0 5px,transparent 5px 10px)";

type PersonView = Person & { membership: { presence: Presence; side: Side } };

// ─── Small pieces ───────────────────────────────────────────────────────────

function Avatar({ person, size, faded, className = "" }: { person?: Pick<Person, "name" | "avatarColor">; size: number; faded?: boolean; className?: string }) {
  if (!person) return null;
  return (
    <span
      className={`${s.avatar} ${className}`}
      title={person.name}
      style={{
        width: size,
        height: size,
        background: person.avatarColor,
        fontSize: Math.round(size * 0.36),
        opacity: faded ? 0.45 : 1,
      }}
    >
      {initials(person.name)}
    </span>
  );
}

function presenceLabel(p: Presence) {
  if (p.kind === "viewing") return { text: "Viewing now", color: "#2f7a63", dot: "#3f9a6f" };
  if (p.kind === "seen") return { text: `Seen ${shortDate(p.at)}`, color: "#a59e94", dot: "#d6cfc5" };
  return { text: "Invited", color: "#a59e94", dot: "transparent" };
}

function MomentGlyph({ kind, size = 13 }: { kind: MomentKind; size?: number }) {
  if (kind === "email") return <MailIcon size={size} />;
  if (kind === "call") return <PhoneIcon size={size} />;
  if (kind === "pending") return <FlagIcon size={size} />;
  return <PageIcon size={size} />;
}

function TypeGlyph({ kind }: { kind: DocumentKind }) {
  if (kind === "slides") return <SlidesIcon />;
  if (kind === "sheet") return <SheetIcon />;
  return <DocIcon />;
}

function Thumbnail({ kind, title }: { kind: DocumentKind; title: string }) {
  if (kind === "slides") {
    return (
      <div className={s.thumbSlides}>
        <div className={s.thumbSlidesText}>
          <div className={s.thumbTitle}>{title}</div>
          <div className={s.thumbLine} style={{ width: "80%" }} />
          <div className={s.thumbLine} style={{ width: "60%" }} />
        </div>
        <div style={{ background: "linear-gradient(135deg,#f6dccb,#d5e6db)" }} />
      </div>
    );
  }
  if (kind === "sheet") {
    return (
      <div className={s.thumbSheet}>
        {[0, 1, 2].map((i) => <div key={`h${i}`} className={s.sheetHead} />)}
        {Array.from({ length: 5 }).flatMap((_, r) => [
          <div key={`k${r}`} className={s.sheetKey} />,
          <div key={`a${r}`} className={s.sheetCell} />,
          <div key={`b${r}`} className={s.sheetCell} />,
        ])}
      </div>
    );
  }
  return (
    <div className={s.thumbDoc}>
      <div className={s.thumbTitle}>{title}</div>
      <div className={s.thumbRule} />
      <div className={s.thumbLine} />
      <div className={s.thumbLine} style={{ width: "90%" }} />
      <div className={s.thumbLine} style={{ width: "95%" }} />
      <div className={s.thumbLine} style={{ width: "72%" }} />
      <div className={s.thumbBlock} />
    </div>
  );
}

function Tag({ kind, className }: { kind: ChangeKind; className: string }) {
  const t = TAG[kind];
  return <span className={className} style={{ background: t.bg, color: t.color }}>{t.label}</span>;
}

// ─── Main component ─────────────────────────────────────────────────────────

interface Props {
  view: ClientSpaceView;
  token: string;
  initialMomentId?: string;
}

interface PreviewState { documentId: string; versionNumber: number; section?: number }

export default function ClientSpace({ view, token, initialMomentId }: Props) {
  const { account, org, deal, space } = view;
  const moments = useMemo(() => sortMoments(view.moments), [view.moments]);
  const people = view.people as PersonView[];
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const [rail, setRail] = useState<"timeline" | "mail">("timeline");
  const [momentId, setMomentId] = useState<string | null>(
    initialMomentId && moments.some((m) => m.id === initialMomentId) ? initialMomentId : null,
  );
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [openVersions, setOpenVersions] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [pinned, setPinned] = useState<string[]>(() => view.documents.filter((d) => d.pinned).map((d) => d.id));
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<ChatAnswer | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Pins are a per-viewer preference, remembered in this browser.
  const pinKey = `atria:pins:${space.id}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(pinKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from browser storage after mount
      if (saved) setPinned(JSON.parse(saved));
    } catch {}
  }, [pinKey]);
  const togglePin = (id: string) => {
    setPinned((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur];
      try { localStorage.setItem(pinKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const selIndex = momentId ? moments.findIndex((m) => m.id === momentId) : -1;
  const selected: TimelineMoment | null = selIndex >= 0 ? moments[selIndex] : null;
  const filtered = selected !== null;
  const asOf = asOfDate(selected);
  const last = moments.length - 1;

  const docs = documentsAsOf(view.documents, selected, pinned);
  const allMail = correspondenceFor(view.correspondence, null);
  const mail = correspondenceFor(view.correspondence, selected);

  const selectMoment = (id: string) => {
    setMomentId((cur) => (cur === id ? null : id));
    setOpenVersions(null);
  };
  const clearMoment = () => setMomentId(null);

  const openDoc = (documentId: string, versionNumber: number, section?: number) => {
    setPreview({ documentId, versionNumber, section });
    setOpenVersions(null);
  };

  useEffect(() => {
    if (!preview) return;
    const el = previewRef.current;
    if (!el) return;
    const target = preview.section ? el.querySelector(`[data-sec="${preview.section}"]`) : null;
    if (target) target.scrollIntoView({ block: "start", behavior: "smooth" });
    else el.scrollTop = 0;
  }, [preview]);

  async function ask(q: string) {
    const text = q.trim();
    if (!text || asking) return;
    setAsking(text);
    setQuestion("");
    try {
      const res = await fetch(`/api/s/${encodeURIComponent(token)}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      setAnswer(res.ok ? data : { question: text, text: "Something went wrong answering that. Please try again.", citations: [] });
    } catch {
      setAnswer({ question: text, text: "Couldn't reach Atria. Check your connection and try again.", citations: [] });
    } finally {
      setAsking(null);
    }
  }

  const buyerLead = space.buyerLeadId ? personById.get(space.buyerLeadId) : undefined;
  const sellerLead = space.sellerLeadId ? personById.get(space.sellerLeadId) : undefined;
  const sides = [
    { side: "buyer" as const, label: account.shortName, short: account.shortName, role: "Buyer" },
    { side: "seller" as const, label: org.name, short: org.shortName, role: "Seller" },
  ].map((sd) => ({ ...sd, members: people.filter((p) => p.membership.side === sd.side) }));

  const previewDoc = preview && view.documents.find((d) => d.id === preview.documentId);
  const previewVersion = previewDoc && (previewDoc.versions.find((v) => v.number === preview.versionNumber) ?? latestVersion(previewDoc));
  const previewIsOld = !!previewDoc && !!previewVersion && previewVersion.number !== latestVersion(previewDoc).number;

  const momentsCount = moments.filter((m) => m.kind !== "pending").length;
  const touched = selected ? documentsTouched(selected) : 0;
  const next = selIndex >= 0 && selIndex < last ? moments[selIndex + 1] : null;

  return (
    <div className={s.root}>
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header className={s.header}>
        <div className={s.grain} />
        <div className={s.headerInner}>
          <div className={s.topBar}>
            <nav className={s.crumbs} aria-label="Breadcrumb">
              <span className={s.crumbAccount}><GridIcon />{account.name}</span>
              <ChevronRight style={{ color: "#b8b1a7" }} />
              <span className={s.crumbDeal}>{deal.name}</span>
            </nav>
            <button type="button" className={`${s.unbutton} ${s.peopleChip}`} onClick={() => setPeopleOpen((o) => !o)} aria-expanded={peopleOpen} aria-label="People in this space">
              {sides.map((sd) => (
                <span key={sd.side} className={s.peopleSide}>
                  <span className={s.peopleSideLabel}>{sd.short}</span>
                  <span className={s.avatarStack}>
                    {sd.members.map((p) => (
                      <Avatar key={p.id} person={p} size={24} faded={p.membership.presence.kind === "invited"} className={s.stackAvatar} />
                    ))}
                  </span>
                </span>
              ))}
              <span className={s.plusDot}><PlusIcon /></span>
            </button>
          </div>

          <div className={s.titleRow}>
            <div className={s.logo}>
              {account.logoUrl
                // eslint-disable-next-line @next/next/no-img-element -- account logos are arbitrary uploads
                ? <img src={account.logoUrl} alt={`${account.shortName} logo`} />
                : <span className={s.logoFallback}>{initials(account.shortName)}</span>}
            </div>
            <div className={s.titleBlock}>
              <span className={s.accountName}>{account.name}</span>
              <h1 className={s.dealName}>{deal.name}</h1>
              <div className={s.keyDetails}>
                {buyerLead && (
                  <div className={s.keyDetail}>
                    <Avatar person={buyerLead} size={26} />
                    <div className={s.keyText}><span className={s.keyLabel}>{account.shortName} lead</span><span className={s.keyValue}>{buyerLead.name}</span></div>
                  </div>
                )}
                {sellerLead && (
                  <div className={s.keyDetail}>
                    <Avatar person={sellerLead} size={26} />
                    <div className={s.keyText}><span className={s.keyLabel}>{org.shortName} lead</span><span className={s.keyValue}>{sellerLead.name}</span></div>
                  </div>
                )}
                {deal.brief?.flight && (
                  <div className={s.keyDetail}>
                    <span className={s.keyIcon}><CalendarIcon /></span>
                    <div className={s.keyText}><span className={s.keyLabel}>Flight</span><span className={s.keyValue}>{dateRange(deal.brief.flight.start, deal.brief.flight.end)}</span></div>
                  </div>
                )}
              </div>
            </div>
            <div className={s.statusPill}>
              <span className={s.statusDot} />
              {space.statusLabel}{space.statusDueDate ? ` · ${shortDate(space.statusDueDate)}` : ""}
            </div>
          </div>
        </div>
      </header>

      {/* ─── People panel ───────────────────────────────────────────── */}
      {peopleOpen && (
        <>
          <div className={s.scrim} onClick={() => setPeopleOpen(false)} />
          <div className={s.peoplePanel} role="dialog" aria-label="People in this space">
            <div className={s.panelHead}>
              <span className={s.panelTitle}>People in this space</span>
              <button type="button" className={`${s.unbutton} ${s.iconButton}`} onClick={() => setPeopleOpen(false)} aria-label="Close"><CloseIcon /></button>
            </div>
            {sides.map((sd) => (
              <div key={sd.side} className={s.sideGroup}>
                <div className={s.sideHead}><span>{sd.label}</span><span>{sd.role}</span></div>
                {sd.members.map((p) => {
                  const pr = presenceLabel(p.membership.presence);
                  return (
                    <div key={p.id} className={s.personRow}>
                      <Avatar person={p} size={32} faded={p.membership.presence.kind === "invited"} />
                      <div className={s.personText}>
                        <span className={s.personName}>{p.name}</span>
                        <span className={s.personTitle}>{p.title}</span>
                      </div>
                      <span className={s.presence} style={{ color: pr.color }}><span className={s.presenceDot} style={{ background: pr.dot }} />{pr.text}</span>
                    </div>
                  );
                })}
              </div>
            ))}
            <div className={s.panelFoot}>
              <span className={s.privacyNote}><LockIcon />Invited people only</span>
              {/* Buyer-side invites need owner approval; wired up with access management. */}
              <button type="button" className={`${s.unbutton} ${s.inviteButton}`} disabled={space.readOnly}><PlusIcon />Invite</button>
            </div>
          </div>
        </>
      )}

      <div className={s.body}>
        {/* ─── Left rail ────────────────────────────────────────────── */}
        <aside className={s.rail}>
          <div className={s.railHead}>
            <h2 className={s.railTitle}>{rail === "timeline" ? "Timeline" : "Correspondence"}</h2>
            {filtered ? (
              <button type="button" className={`${s.unbutton} ${s.todayButton}`} onClick={clearMoment}><ResetIcon />Today</button>
            ) : (
              <span className={s.railSub}>{rail === "timeline" ? `${momentsCount} moments` : `${allMail.length} threads`}</span>
            )}
          </div>
          <div className={s.tabs} role="tablist">
            <button type="button" role="tab" aria-selected={rail === "timeline"} className={`${s.unbutton} ${s.tab}`} onClick={() => setRail("timeline")}><TimelineIcon />Timeline</button>
            <button type="button" role="tab" aria-selected={rail === "mail"} className={`${s.unbutton} ${s.tab}`} onClick={() => setRail("mail")}><MailIcon />Correspondence</button>
          </div>

          {rail === "timeline" ? (
            <ol className={s.moments}>
              {moments.map((m, i) => {
                const sel = i === selIndex;
                const isOpen = m.kind === "pending";
                const after = filtered && i > selIndex;
                const reached = filtered ? i < selIndex : i < last - 1;
                const nextPending = moments[i + 1]?.kind === "pending";
                const solid = reached || sel ? LINE_REACHED : LINE_FUTURE;
                const vline = i === last ? DASHED
                  : nextPending ? `linear-gradient(180deg,${reached ? LINE_REACHED : LINE_FUTURE} 40%,transparent 40%),${DASHED}`
                  : solid;
                const n = documentsTouched(m);
                return (
                  <li key={m.id} className={s.moment} data-selected={sel} style={{ opacity: after ? 0.5 : 1, animationDelay: `${i * 0.05}s` }}>
                    <div className={s.momentLine} style={{ top: i === 0 ? 30 : 0, bottom: i === last ? "calc(100% - 22px)" : 0, background: vline }} />
                    <button type="button" className={`${s.unbutton} ${s.momentRow}`} onClick={() => selectMoment(m.id)} aria-pressed={sel}>
                      <span
                        className={s.momentDot}
                        style={{
                          background: sel ? "#2f7a63" : isOpen ? "#fffdfa" : m.kind === "call" ? "#f6e4d8" : "#e7f0eb",
                          color: sel ? "#fff" : isOpen ? "#2f7a63" : m.kind === "call" ? "#b0603a" : "#2f7a63",
                          border: !sel && isOpen ? "1.5px dashed #2f7a63" : 0,
                          boxShadow: sel ? "0 0 0 4px #d8e9df,0 0 0 7px rgba(47,122,99,.28),0 6px 16px rgba(47,122,99,.25)" : "0 0 0 4px #f7f4ef",
                        }}
                      >
                        {isOpen && <span className={s.breathe} />}
                        <MomentGlyph kind={m.kind} />
                      </span>
                      <span className={s.momentText}>
                        <span className={s.momentTitle} style={{ fontWeight: sel ? 600 : 400, color: sel ? "#24211d" : isOpen ? "#2f7a63" : "#5a544c" }}>{m.title}</span>
                        <span className={s.momentDate} style={{ color: sel ? "#2f7a63" : "#a59e94" }}>{shortDate(m.occurredAt)} · {m.meta}</span>
                      </span>
                      {n > 0 && (
                        <span className={s.docCount} title="Documents changed" style={{ color: sel ? "#2f7a63" : "#a59e94" }}>
                          <PageIcon size={10} strokeWidth={1.6} />{n}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <>
              {filtered && (
                <button type="button" className={`${s.unbutton} ${s.asOfChip}`} onClick={clearMoment}>
                  {shortDate(selected.occurredAt)}<CloseIcon size={10} strokeWidth={2} />
                </button>
              )}
              <ul className={s.threads}>
                {mail.map((c) => {
                  const call = c.kind === "call";
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`${s.unbutton} ${s.thread}`}
                        style={{ background: filtered ? "#f3eee7" : "transparent" }}
                        onClick={() => c.momentId && !filtered && selectMoment(c.momentId)}
                        title={filtered ? undefined : "Show this moment"}
                      >
                        <span className={s.threadIcon} style={{ background: call ? "#f6e4d8" : "#e7f0eb", color: call ? "#b0603a" : "#2f7a63" }}>
                          {call ? <PhoneIcon size={14} strokeWidth={1.4} /> : <MailIcon size={14} strokeWidth={1.4} />}
                        </span>
                        <span className={s.threadBody}>
                          <span className={s.threadTop}>
                            <span className={s.threadTitle}>{c.subject}</span>
                            <span className={s.threadDate}>{shortDate(c.occurredAt)}</span>
                          </span>
                          <span className={s.threadSummary}>{c.summary}</span>
                          <span className={s.threadFoot}>
                            <span className={s.threadPeople}>
                              {c.participantIds.map((id) => <Avatar key={id} person={personById.get(id)} size={18} />)}
                            </span>
                            <span className={s.threadMeta}>{c.meta}<ArrowUpRight style={{ color: "#2f7a63" }} /></span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {filtered && (
                <button type="button" className={`${s.unbutton} ${s.showAll}`} onClick={clearMoment}>Show all {allMail.length} threads</button>
              )}
            </>
          )}
        </aside>

        {/* ─── Main column ──────────────────────────────────────────── */}
        <main className={s.main}>
          <div className={s.mainScroll}>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>Documents</h2>
              <span className={s.sectionSub}>{asOf ? `As of ${shortDate(asOf)}` : `${view.documents.length} shared`}</span>
            </div>

            {selected && (
              <div className={s.banner}>
                <span className={s.bannerDot} />
                <div className={s.bannerText}>
                  <span className={s.bannerTitle}>{selected.title}</span>
                  <span className={s.bannerMeta}>
                    {shortDate(selected.occurredAt)} · {selected.meta} · {touched ? `${touched} ${touched === 1 ? "document" : "documents"} changed` : "No document changes"}
                  </span>
                </div>
                <div className={s.bannerNotes}>
                  {generalNotes(selected).map((n, i) => (
                    <span key={i} className={s.bannerNote}><Tag kind={n.kind} className={s.bannerTag} />{n.text}</span>
                  ))}
                  {next && (
                    <button type="button" className={`${s.unbutton} ${s.nextButton}`} onClick={() => selectMoment(next.id)}>
                      Next<ChevronRight size={10} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <ul className={s.docGrid}>
              {docs.map(({ document: d, version: v, changes, pinned: isPinned }, i) => {
                const exists = v !== null;
                const cur = latestVersion(d);
                const isCurrent = exists && v.number === cur.number;
                const highlight = filtered ? changes.length > 0 : isCurrent;
                const sharer = personById.get((v ?? cur).sharedByPersonId);
                const [tintBg, tintFg] = TYPE_TINT[d.kind];
                const versOpen = openVersions === d.id && exists;
                const hasOld = d.versions.length > 1;
                return (
                  <li key={d.id} className={s.docWrap} style={{ animationDelay: `${i * 0.06}s`, opacity: !exists ? 0.4 : filtered && !changes.length ? 0.55 : 1 }}>
                    <div className={s.card} data-highlight={highlight}>
                      <div className={s.thumb}>
                        {exists && <button type="button" className={`${s.unbutton} ${s.thumbOpen}`} onClick={() => openDoc(d.id, v.number)} aria-label={`Open ${d.title}`} />}
                        <Thumbnail kind={d.kind} title={d.title} />
                        {asOf && exists && <span className={s.asOfBadge}><ClockIcon />as of {shortDate(asOf)}</span>}
                        <button type="button" className={`${s.unbutton} ${s.pin}`} aria-pressed={isPinned} title={isPinned ? "Unpin" : "Pin"} aria-label={isPinned ? `Unpin ${d.title}` : `Pin ${d.title}`} onClick={() => togglePin(d.id)}>
                          <PinIcon />
                        </button>
                      </div>
                      <div className={s.cardBody}>
                        <button type="button" className={`${s.unbutton} ${s.cardHead}`} disabled={!exists} onClick={() => exists && openDoc(d.id, v.number)}>
                          <span className={s.typeIcon} style={{ background: tintBg, color: tintFg }}><TypeGlyph kind={d.kind} /></span>
                          <span className={s.cardText}>
                            <span className={s.cardTitle}>{d.title}</span>
                            <span className={s.cardSummary}>{(v ?? cur).summary}</span>
                          </span>
                        </button>
                        {changes.length > 0 && (
                          <div className={s.changes}>
                            {changes.map((c, j) => (
                              <div key={j} className={s.change}><Tag kind={c.kind} className={s.changeTag} /><span>{c.text}</span></div>
                            ))}
                          </div>
                        )}
                        <div className={s.cardFoot}>
                          <span className={s.sharer}>
                            <Avatar person={sharer} size={22} faded={!exists} />
                            {exists ? shortDate(v.committedAt) : "Not shared yet"}
                          </span>
                          {exists && (
                            <button
                              type="button"
                              className={`${s.unbutton} ${s.versionChip}`}
                              style={{ background: isCurrent ? "#e7f0eb" : "#ebe5dc", color: isCurrent ? "#2f7a63" : "#7a736a" }}
                              disabled={!hasOld}
                              aria-expanded={hasOld ? versOpen : undefined}
                              onClick={() => setOpenVersions(versOpen ? null : d.id)}
                            >
                              <LayersIcon />v{v.number}
                              {hasOld && <ChevronDown style={{ transform: versOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />}
                            </button>
                          )}
                        </div>
                        {versOpen && (
                          <ul className={s.versionList}>
                            {[...d.versions].reverse().map((x) => {
                              const isCur = x.number === cur.number;
                              return (
                                <li key={x.id}>
                                  <button type="button" className={`${s.unbutton} ${s.versionRow}`} style={{ color: isCur ? "#2f7a63" : "#a59e94" }} onClick={() => openDoc(d.id, x.number)}>
                                    <LayersIcon size={11} />
                                    <span style={{ fontWeight: 600 }}>v{x.number}</span>
                                    <span style={{ flex: 1 }}>{isCur ? "Current" : "Superseded"}</span>
                                    <span>{shortDate(x.committedAt)}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ─── Document viewer ──────────────────────────────────────── */}
          {previewDoc && previewVersion && (
            <div className={s.preview} ref={previewRef}>
              <div className={s.previewInner}>
                <div className={s.previewBar}>
                  <button type="button" className={`${s.unbutton} ${s.backButton}`} onClick={() => setPreview(null)}><ChevronLeft />All documents</button>
                  <div className={s.previewTools}>
                    <span className={s.previewVer} style={{ background: previewIsOld ? "#ebe5dc" : "#e7f0eb", color: previewIsOld ? "#7a736a" : "#2f7a63" }}>
                      <LayersIcon />v{previewVersion.number} · {previewIsOld ? "Superseded" : "Current"}
                    </span>
                    {previewVersion.storagePath && (
                      <a className={s.download} href={`/api/s/${encodeURIComponent(token)}/files/${previewVersion.id}`} title="Download"><DownloadIcon /></a>
                    )}
                  </div>
                </div>
                {previewIsOld && (
                  <div className={s.superseded}>
                    <span>An earlier version. Replaced by v{latestVersion(previewDoc).number}.</span>
                    <button type="button" className={`${s.unbutton} ${s.toCurrent}`} onClick={() => openDoc(previewDoc.id, latestVersion(previewDoc).number)}>Open current →</button>
                  </div>
                )}
                <article className={s.page}>
                  <div className={s.pageHead}>
                    <h2 className={s.pageTitle}>{previewDoc.title}</h2>
                    <div className={s.pageByline}>
                      <Avatar person={personById.get(previewVersion.sharedByPersonId)} size={20} />
                      {personById.get(previewVersion.sharedByPersonId)?.name} · {shortDate(previewVersion.committedAt)}
                    </div>
                  </div>
                  {previewVersion.sections.map((sec) => (
                    <section key={sec.id} className={s.pageSection} data-sec={sec.number} data-cited={preview?.section === sec.number}>
                      <div className={s.pageSectionHead}><span className={s.sectionNum}>§{sec.number}</span><h3 className={s.sectionHeading}>{sec.heading}</h3></div>
                      {sec.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
                    </section>
                  ))}
                </article>
              </div>
            </div>
          )}

          {/* ─── Chat dock ────────────────────────────────────────────── */}
          <div className={s.dock}>
            {(answer || asking) && (
              <div className={s.answer} aria-live="polite">
                <div className={s.answerHead}>
                  <span className={s.answerQ}><span className={s.diamond} />{asking ?? answer?.question}</span>
                  {!asking && <button type="button" className={`${s.unbutton} ${s.iconButton}`} style={{ padding: 2 }} onClick={() => setAnswer(null)} aria-label="Dismiss answer"><CloseIcon /></button>}
                </div>
                {asking ? (
                  <p className={`${s.answerText} ${s.answerPending}`}>Reading the documents…</p>
                ) : answer && (
                  <>
                    <p className={s.answerText}>{answer.text}</p>
                    {answer.citations.length > 0 && (
                      <div className={s.cites}>
                        {answer.citations.map((c) => (
                          <button key={c.label} type="button" className={`${s.unbutton} ${s.cite}`} onClick={() => { setAnswer(null); openDoc(c.documentId, c.versionNumber, c.sectionNumber); }}>
                            <PageIcon size={12} />{c.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {space.suggestedQuestions.length > 0 && (
              <div className={s.chips}>
                {space.suggestedQuestions.map((q) => (
                  <button key={q} type="button" className={`${s.unbutton} ${s.chip}`} onClick={() => ask(q)}>
                    <SparkleIcon style={{ color: "#2f7a63" }} />{q}
                  </button>
                ))}
              </div>
            )}
            <form className={s.askForm} onSubmit={(e) => { e.preventDefault(); ask(question); }}>
              <SparkleIcon size={16} style={{ color: "#2f7a63", flex: "none" }} />
              <input className={s.askInput} type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about this deal" aria-label="Ask about this deal" maxLength={500} />
              <button type="submit" className={s.askSend} disabled={!!asking} aria-label="Ask"><SendIcon /></button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
