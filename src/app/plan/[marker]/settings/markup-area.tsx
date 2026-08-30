"use client";

import { useEffect, useRef } from "react";
import { input as inputCls } from "@/components/ui";

/**
 * A textarea that knows the site's formatting marks: little buttons that
 * wrap the selection in them, and a height that follows the text instead of
 * scrolling inside itself. Uncontrolled on purpose, like the fields around
 * it — the form reads it by name.
 */
export function MarkupArea({
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
  const ref = useRef<HTMLTextAreaElement>(null);

  const grow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  };
  useEffect(grow, []);

  // Edits count as typing: the same bubbled input the form's dirty-tracking
  // and this field's own growth already listen for.
  const settle = (el: HTMLTextAreaElement) => {
    grow();
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
  };

  const wrap = (before: string, after: string, fallback = "text") => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = el.value.slice(s, e) || fallback;
    el.setRangeText(before + sel + after, s, e, "select");
    settle(el);
  };

  const linePrefix = (prefix: string) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const start = value.lastIndexOf("\n", s - 1) + 1;
    const end = e === s ? value.indexOf("\n", e) : e;
    const stop = end === -1 ? value.length : end;
    const block = value
      .slice(start, stop)
      .split("\n")
      .map((l) => (l.startsWith(prefix) ? l : prefix + l))
      .join("\n");
    el.setRangeText(block, start, stop, "select");
    settle(el);
  };

  const btn =
    "border-ink/20 hover:border-ink/50 rounded border bg-white px-2 py-0.5 text-xs transition-colors";

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        <button type="button" title="Bold" className={`${btn} font-bold`} onClick={() => wrap("**", "**")}>
          B
        </button>
        <button type="button" title="Italic" className={`${btn} italic`} onClick={() => wrap("*", "*")}>
          I
        </button>
        <button type="button" title="Heading" className={`${btn} font-bold`} onClick={() => linePrefix("## ")}>
          H
        </button>
        <button type="button" title="List" className={btn} onClick={() => linePrefix("- ")}>
          • list
        </button>
        <button type="button" title="Link" className={`${btn} underline`} onClick={() => wrap("[", "](https://)", "link text")}>
          link
        </button>
      </div>
      <textarea
        ref={ref}
        id={id}
        name={name}
        rows={3}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onInput={grow}
        className={`${inputCls} resize-none overflow-hidden`}
      />
    </div>
  );
}
