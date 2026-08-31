"use client";

import { useEffect, useRef, useState } from "react";

/**
 * What you see is what the page will show: an editable area rendering bold,
 * headings, lists and links as themselves while it is written. Underneath it
 * still speaks the site's few marks — the visible editor serialises to them
 * on every keystroke into a hidden field the form reads by name, so the
 * server and the public page never learn HTML existed.
 */

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const inlineHtml = (text: string) =>
  escapeHtml(text)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
      '<a href="$2">$1</a>',
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");

function marksToHtml(text: string): string {
  if (!text.trim()) return "";
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").filter((l) => l.trim() !== "");
      if (lines.length === 0) return "";
      if (lines.every((l) => l.trim().startsWith("- "))) {
        return `<ul>${lines.map((l) => `<li>${inlineHtml(l.trim().slice(2))}</li>`).join("")}</ul>`;
      }
      // Mirrors RichText: a heading line needs no blank line around it.
      let html = "";
      let para: string[] = [];
      const flush = () => {
        if (para.length) html += `<p>${para.map(inlineHtml).join("<br>")}</p>`;
        para = [];
      };
      for (const raw of lines) {
        const l = raw.trim();
        const h = /^#{1,3} ?/.exec(l);
        if (h) {
          flush();
          html += `<h3>${inlineHtml(l.slice(h[0].length))}</h3>`;
        } else {
          para.push(raw);
        }
      }
      flush();
      return html;
    })
    .join("");
}

function inlineMarks(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const inner = Array.from(el.childNodes).map(inlineMarks).join("");
  switch (el.tagName) {
    case "STRONG":
    case "B":
      return inner.trim() ? `**${inner}**` : inner;
    case "EM":
    case "I":
      return inner.trim() ? `*${inner}*` : inner;
    case "A": {
      const href = el.getAttribute("href") ?? "";
      return /^(https?:\/\/|mailto:)/.test(href) ? `[${inner}](${href})` : inner;
    }
    case "BR":
      return "\n";
    default:
      return inner;
  }
}

function htmlToMarks(root: HTMLElement): string {
  const blocks: string[] = [];
  let loose = "";
  const flush = () => {
    if (loose.trim()) blocks.push(loose.trim());
    loose = "";
  };
  for (const node of Array.from(root.childNodes)) {
    const el = node as HTMLElement;
    const tag = node.nodeType === Node.ELEMENT_NODE ? el.tagName : "";
    if (/^H[1-3]$/.test(tag)) {
      flush();
      blocks.push(`## ${inlineMarks(el).trim()}`);
    } else if (tag === "UL" || tag === "OL") {
      flush();
      blocks.push(
        Array.from(el.querySelectorAll("li"))
          .map((li) => `- ${inlineMarks(li).trim()}`)
          .join("\n"),
      );
    } else if (tag === "P" || tag === "DIV") {
      flush();
      const t = inlineMarks(el).trim();
      if (t) blocks.push(t);
    } else {
      loose += inlineMarks(node);
    }
  }
  flush();
  return blocks.join("\n\n");
}

export function WysiwygArea({
  id,
  name,
  defaultValue,
  placeholder,
}: {
  id: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const [empty, setEmpty] = useState(!defaultValue.trim());

  useEffect(() => {
    if (box.current) box.current.innerHTML = marksToHtml(defaultValue);
    // A form reset puts native fields back to their defaults on its own; the
    // editable area has to be told. Cancel buttons and the agenda's add-form
    // both count on this.
    const form = hidden.current?.form;
    const onReset = () => {
      if (box.current) box.current.innerHTML = marksToHtml(defaultValue);
      setEmpty(!defaultValue.trim());
    };
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
    // The stored value only changes through typing; the default never does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    if (!box.current || !hidden.current) return;
    hidden.current.value = htmlToMarks(box.current);
    setEmpty(!box.current.textContent?.trim());
  };

  const cmd = (command: string, value?: string) => {
    box.current?.focus();
    document.execCommand(command, false, value);
    sync();
  };

  const heading = () => {
    const sel = window.getSelection();
    const inHeading =
      sel?.anchorNode &&
      (sel.anchorNode.parentElement?.closest("h3") ||
        (sel.anchorNode as HTMLElement).tagName === "H3");
    cmd("formatBlock", inHeading ? "<p>" : "<h3>");
  };

  const link = () => {
    const url = window.prompt("Link address (https://…)");
    if (url && /^(https?:\/\/|mailto:)/.test(url)) cmd("createLink", url);
  };

  const btn =
    "border-ink/20 hover:border-ink/50 rounded border bg-white px-2 py-0.5 text-xs transition-colors";

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        <button type="button" title="Bold" className={`${btn} font-bold`} onClick={() => cmd("bold")}>
          B
        </button>
        <button type="button" title="Italic" className={`${btn} italic`} onClick={() => cmd("italic")}>
          I
        </button>
        <button type="button" title="Heading" className={`${btn} font-bold`} onClick={heading}>
          H
        </button>
        <button type="button" title="List" className={btn} onClick={() => cmd("insertUnorderedList")}>
          • list
        </button>
        <button type="button" title="Link" className={`${btn} underline`} onClick={link}>
          link
        </button>
      </div>
      <div className="relative">
        {empty && placeholder && (
          <p className="text-ink/40 pointer-events-none absolute top-2.5 left-3.5 text-sm">
            {placeholder}
          </p>
        )}
        <div
          ref={box}
          id={id}
          contentEditable
          role="textbox"
          aria-multiline="true"
          onInput={sync}
          onBlur={sync}
          className="border-ink/20 focus:border-ink min-h-24 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm leading-relaxed outline-none [&_a]:underline [&_h3]:my-1 [&_h3]:text-lg [&_h3]:font-bold [&_li]:ml-1 [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
        />
      </div>
      <input ref={hidden} type="hidden" name={name} defaultValue={defaultValue} />
    </div>
  );
}
