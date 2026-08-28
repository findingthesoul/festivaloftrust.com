// Wraps the Festival planner export into a complete HTML document.
//
// The tool is exported as a bare fragment (it starts at <style>, with no
// doctype, charset, viewport or title). Serving that directly renders
// zoomed-out and unscaled on phones, so this wraps it at build time.
//
// Keeping the raw export untouched in src/assets means a new version of the
// planner is a straight drop-in replacement — no re-patching by hand.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "src/assets/planner.fragment.html");
const out = resolve(root, "public/planner.html");

let fragment = readFileSync(src, "utf8");

/**
 * Patches applied to every export.
 *
 * The rate per hour is written into the tool as a literal — 100 social, 150
 * commercial — and cannot be changed without editing it. Editing the export by
 * hand would mean re-editing it on every new one, which is exactly what
 * keeping the raw file untouched was meant to avoid.
 *
 * So the change is described here and applied at build time. Each patch
 * asserts its own anchor: if a future export renames or restructures around
 * one, the build fails loudly rather than quietly dropping the feature.
 */
function patch(what, find, replace) {
  if (!fragment.includes(find)) {
    throw new Error(
      `planner: could not apply "${what}" — the export no longer contains:\n  ${find}\n` +
        `Re-check scripts/build-planner.mjs against src/assets/planner.fragment.html.`,
    );
  }
  fragment = fragment.replace(find, replace);
}

// 1. Two fields to set the rates, beside the VAT panel that already talks
//    about rates following the country.
patch(
  "rate inputs",
  `        <p class="hint">All prices are exclusive of VAT. The rate follows the country where the festival takes place.</p>`,
  `        <div class="row two">
          <div><label for="rateSocial">Rate per hour, social</label>
            <input type="number" id="rateSocial" value="100" min="0" step="5"></div>
          <div><label for="rateCommercial">Rate per hour, commercial</label>
            <input type="number" id="rateCommercial" value="150" min="0" step="5"></div>
        </div>
        <p class="hint">All prices are exclusive of VAT. The rate follows the country where the festival takes place.</p>`,
);

// 2. Read them instead of the literals, falling back to what they were.
patch(
  "rate calculation",
  `    const rate   = mode === "social" ? 100 : 150;`,
  `    const rateFor = (id, fallback) => {
      const el = document.getElementById(id);
      const n = el ? Number(el.value) : NaN;
      return Number.isFinite(n) && n >= 0 ? n : fallback;
    };
    const rate   = mode === "social" ? rateFor("rateSocial", 100) : rateFor("rateCommercial", 150);`,
);

// 3. Recalculate when they change.
patch(
  "rate recalculation",
  `  ["visitors","trainees","location","otherTotal","drinks","food","otherPP","travel","vat","discval"]`,
  `  ["visitors","trainees","location","otherTotal","drinks","food","otherPP","travel","vat","discval","rateSocial","rateCommercial"]`,
);

// 4. Keep them in the snapshot, so a festival's rates are saved with its
//    figures rather than resetting to the defaults on every visit.
patch(
  "rate persistence",
  `  const NUM_IDS  = ["visitors","trainees","location","otherTotal","drinks","food","otherPP",
                    "travel","vat","discval"];`,
  `  const NUM_IDS  = ["visitors","trainees","location","otherTotal","drinks","food","otherPP",
                    "travel","vat","discval","rateSocial","rateCommercial"];`,
);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Festival planner — Festival of Trust</title>
<meta name="description" content="Plan a Festival of Trust: set the variables and build the offer.">
<!-- Working tool, not a landing page: keep it out of search results. -->
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
</head>
<body>
${fragment}
</body>
</html>
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`planner: wrapped ${fragment.length} bytes -> public/planner.html`);
