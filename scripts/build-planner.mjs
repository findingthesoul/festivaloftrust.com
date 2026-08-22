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

const fragment = readFileSync(src, "utf8");

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
