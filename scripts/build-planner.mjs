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

// 5. Currency: one symbol for every printed amount, settable by the host
//    page, with the option of scaling the default prices by the currency's
//    ratio (a fresh South African festival starts from half the base rates).
patch(
  "currency formatter",
  `  const eur = n => "\\u20AC" + Math.round(n).toLocaleString("de-DE");`,
  `  let CURRENCY_SYMBOL = "\\u20AC";
  const eur = n => CURRENCY_SYMBOL + Math.round(n).toLocaleString("de-DE");
  function setCurrency(symbol, ratio, scaleDefaults) {
    CURRENCY_SYMBOL = symbol || "\\u20AC";
    if (scaleDefaults && ratio && ratio !== 1) {
      ["rateSocial","rateCommercial","drinks","food","otherPP","travel","location","otherTotal"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const n = Number(el.value);
        if (Number.isFinite(n) && n > 0) el.value = String(Math.round(n * ratio));
      });
    }
    calc();
  }`,
);

// 6. The Fundamentals tab button, hidden until the host page says the
//    viewer is the workspace admin.
patch(
  "fundamentals tab button",
  `<button type="button" id="tabHours" role="tab" aria-selected="false">Hours per step</button>`,
  `<button type="button" id="tabHours" role="tab" aria-selected="false">Hours per step</button>
        <button type="button" id="tabFund" role="tab" aria-selected="false" style="display:none">Fundamentals</button>`,
);

// 7. The other tabs put the fundamentals panel away again.
patch(
  "fundamentals tab switching",
  `  $("tabOffer").onclick = () => setTab(false);
  $("tabHours").onclick = () => setTab(true);`,
  `  const hideFund = () => { const p = document.getElementById("pageFund"); if (p) p.style.display = "none"; $("tabFund").setAttribute("aria-selected", "false"); };
  $("tabOffer").onclick = () => { hideFund(); setTab(false); };
  $("tabHours").onclick = () => { hideFund(); setTab(true); };`,
);

// 8. The panel itself, and the host-page seam: setFundamentals(list, canEdit)
//    fills and reveals it; window.onFundamentalsSave carries edits out.
patch(
  "fundamentals panel",
  `  function snapshot() {`,
  `  const fundPanel = document.createElement("section");
  fundPanel.id = "pageFund";
  fundPanel.style.display = "none";
  fundPanel.innerHTML = '<div class="panel"><h2>Fundamentals</h2>' +
    '<p class="hint">Currencies, and each one\\u2019s ratio against the base prices. A festival that chooses a currency starts from the base defaults times its ratio \\u2014 0.5 means half the base rates.</p>' +
    '<div id="fundRows"></div>' +
    '<p style="margin-top:10px"><button type="button" id="fundAdd">Add currency</button> ' +
    '<button type="button" id="fundSave">Save</button> <span id="fundNote" class="hint"></span></p></div>';
  $("pageOffer").parentNode.insertBefore(fundPanel, $("pageOffer").nextSibling);
  let FUND = [];
  function drawFund() {
    $("fundRows").innerHTML = FUND.map((c, i) =>
      '<div style="display:flex;gap:8px;margin:6px 0;align-items:center">' +
      '<input style="width:64px" data-i="' + i + '" data-k="code" maxlength="3" placeholder="EUR" value="' + (c.code || "") + '">' +
      '<input style="width:52px" data-i="' + i + '" data-k="symbol" placeholder="\\u20AC" value="' + (c.symbol || "") + '">' +
      '<input style="flex:1" data-i="' + i + '" data-k="label" placeholder="Euro" value="' + (c.label || "") + '">' +
      '<input style="width:88px" data-i="' + i + '" data-k="ratio" type="number" step="0.05" min="0.05" value="' + (c.ratio || 1) + '">' +
      '<button type="button" data-del="' + i + '">\\u00d7</button></div>').join("");
  }
  $("fundRows") || null;
  fundPanel.addEventListener("input", e => {
    const t = e.target;
    if (t.dataset && t.dataset.k) FUND[Number(t.dataset.i)][t.dataset.k] = t.dataset.k === "ratio" ? Number(t.value) : t.value;
  });
  fundPanel.addEventListener("click", e => {
    const t = e.target;
    if (t.id === "fundAdd") { FUND.push({ code: "", symbol: "", label: "", ratio: 1 }); drawFund(); }
    if (t.dataset && t.dataset.del !== undefined && t.dataset.del !== "") { FUND.splice(Number(t.dataset.del), 1); drawFund(); }
    if (t.id === "fundSave" && typeof window.onFundamentalsSave === "function") {
      $("fundNote").textContent = "Saving\\u2026";
      Promise.resolve(window.onFundamentalsSave(FUND)).then(r => {
        $("fundNote").textContent = r && r.error ? r.error : "Saved";
      });
    }
  });
  function setFundamentals(list, canEdit) {
    FUND = (Array.isArray(list) ? list : []).map(c => ({ code: c.code, symbol: c.symbol, label: c.label, ratio: Number(c.ratio) || 1 }));
    $("tabFund").style.display = canEdit ? "" : "none";
    drawFund();
  }
  $("tabFund").onclick = () => {
    $("pageHours").style.display = "none";
    $("pageOffer").style.display = "none";
    fundPanel.style.display = "block";
    $("tabFund").setAttribute("aria-selected", "true");
    $("tabOffer").setAttribute("aria-selected", "false");
    $("tabHours").setAttribute("aria-selected", "false");
  };

  function snapshot() {`,
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
