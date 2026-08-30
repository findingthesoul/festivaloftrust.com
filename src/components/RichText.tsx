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
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (lines.length === 0) return null;
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.trim().slice(2))}</li>
              ))}
            </ul>
          );
        }
        const heading = lines.length === 1 && /^#{1,3} ?/.exec(lines[0].trim());
        if (heading) {
          return (
            <h3 key={i} className="text-xl font-bold tracking-[-0.01em]">
              {inline(lines[0].trim().slice(heading[0].length))}
            </h3>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
