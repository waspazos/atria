// Interim "Ask about this deal" answerer: retrieves from the current version
// of every shared document and cites the sections it used. Build step 8
// replaces the answer text with a Claude call; the response shape (answer +
// section citations) stays the same.

import type { ClientSpaceView, DocumentSection, SpaceDocument } from "@/lib/domain/types";
import { latestVersion } from "@/lib/domain/timeline";

export interface Citation {
  documentId: string;
  versionNumber: number;
  sectionNumber: number;
  label: string; // "Summer Creator Proposal v3 · §3 Pricing"
}

export interface ChatAnswer {
  question: string;
  text: string;
  citations: Citation[];
}

const STOP = new Set(
  "a an the is are was were what whats what's show me tell about of in on for to and or how do does did this that it with by be our your my we us deal".split(" "),
);
const tokenize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9$\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    // crude stemming so "creators"/"creator", "measured"/"measurement" meet
    .map((t) => t.replace(/(ments?|ed|ing|s)$/, ""));

interface Hit {
  doc: SpaceDocument;
  versionNumber: number;
  section: DocumentSection;
  score: number;
}

function cite(h: Hit): Citation {
  return {
    documentId: h.doc.id,
    versionNumber: h.versionNumber,
    sectionNumber: h.section.number,
    label: `${h.doc.title} v${h.versionNumber} · §${h.section.number} ${h.section.heading}`,
  };
}

function search(view: ClientSpaceView, terms: string[], docs = view.documents): Hit[] {
  const hits: Hit[] = [];
  for (const doc of docs) {
    const v = latestVersion(doc);
    const titleTerms = new Set(tokenize(doc.title));
    for (const section of v.sections) {
      const heading = new Set(tokenize(section.heading));
      const body = tokenize(section.paragraphs.join(" "));
      let score = 0;
      for (const t of terms) {
        if (heading.has(t)) score += 3;
        if (titleTerms.has(t)) score += 2;
        score += body.filter((b) => b === t).length;
      }
      if (score > 0) hits.push({ doc, versionNumber: v.number, section, score });
    }
  }
  return hits.sort((a, b) => b.score - a.score);
}

export function answerQuestion(view: ClientSpaceView, question: string): ChatAnswer {
  const q = question.trim();

  // "What changed in v3?" — compare a version with the one before it.
  const versionAsk = q.match(/\bv(\d+)\b/i);
  if (versionAsk || /\bchang/i.test(q)) {
    const n = versionAsk ? Number(versionAsk[1]) : null;
    const doc =
      view.documents.find((d) => n !== null && latestVersion(d).number === n) ??
      view.documents.find((d) => n !== null && d.versions.some((v) => v.number === n)) ??
      [...view.documents].sort((a, b) =>
        latestVersion(b).committedAt.localeCompare(latestVersion(a).committedAt),
      )[0];
    if (doc) {
      const idx = n !== null ? doc.versions.findIndex((v) => v.number === n) : doc.versions.length - 1;
      const cur = doc.versions[idx >= 0 ? idx : doc.versions.length - 1];
      const prev = doc.versions[doc.versions.indexOf(cur) - 1];
      const text = prev
        ? `v${cur.number} of the ${doc.title} replaced v${prev.number}. v${prev.number}: ${prev.summary} v${cur.number}: ${cur.summary}`
        : `v${cur.number} is the first version of the ${doc.title}: ${cur.summary}`;
      return {
        question: q,
        text,
        citations: cur.sections.slice(0, 2).map((section) => ({
          documentId: doc.id,
          versionNumber: cur.number,
          sectionNumber: section.number,
          label: `${doc.title} v${cur.number} · §${section.number} ${section.heading}`,
        })),
      };
    }
  }

  const hits = search(view, tokenize(q));
  if (!hits.length) {
    return {
      question: q,
      text: "I couldn't find that in the documents shared in this space. Try asking about the proposal, the creators, pricing or measurement.",
      citations: [],
    };
  }
  const top = hits.slice(0, 2).filter((h, i) => i === 0 || h.score >= hits[0].score / 2);
  return {
    question: q,
    text: top.map((h) => h.section.paragraphs[0]).join(" "),
    citations: top.map(cite),
  };
}
