import { Fragment } from "react";

/**
 * The organiser's few formatting marks, rendered: **bold**, *italic*,
 * [links](https://…), ## headings and - lists. Hand-rolled on purpose — a
 * full markdown engine renders more than we want organisers to publish, and
 * links only match http(s) and mailto, so nothing executable can be smuggled
 * in. Everything unmatched stays literal text, which React escapes.
 */

const INLINE =
  /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

function inline(text: string) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    if (m[1]) {
      out.push(
        <a
          key={k++}
          href={m[2]}
          className="underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
        >
          {m[1]}
        </a>,
      );
    } else if (m[3]) {
      out.push(<strong key={k++}>{m[3]}</strong>);
    } else {
      out.push(<em key={k++}>{m[4]}</em>);
    }
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const out: React.ReactNode[] = [];
  let key = 0;
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;
    if (lines.every((l) => l.trim().startsWith("- "))) {
      out.push(
        <ul key={key++} className="list-disc space-y-1.5 pl-5">
          {lines.map((l, j) => (
            <li key={j}>{inline(l.trim().slice(2))}</li>
          ))}
        </ul>,
      );
      continue;
    }
    // A heading needs no blank line around it: any line opening with # marks
    // becomes one, and the lines between headings group into paragraphs.
    let para: string[] = [];
    const flush = () => {
      if (!para.length) return;
      const run = para;
      para = [];
      out.push(
        <p key={key++}>
          {run.map((l, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {inline(l)}
            </Fragment>
          ))}
        </p>,
      );
    };
    for (const raw of lines) {
      const l = raw.trim();
      const h = /^#{1,3} ?/.exec(l);
      if (h) {
        flush();
        out.push(
          <h3 key={key++} className="text-xl font-bold tracking-[-0.01em]">
            {inline(l.slice(h[0].length))}
          </h3>,
        );
      } else {
        para.push(raw);
      }
    }
    flush();
  }
  return <>{out}</>;
}
