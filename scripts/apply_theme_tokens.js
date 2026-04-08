const fs = require("fs");
const path = require("path");

const replacements = [
  ["bg-white", "bg-bg-card"],
  ["bg-zinc-50", "bg-bg-base"],
  ["bg-zinc-100", "bg-bg-muted"],
  ["bg-zinc-200", "bg-bg-subtle"],
  ["bg-black/40", "bg-bg-overlay"],
  ["bg-zinc-900", "bg-btn-primary"],
  ["bg-zinc-800", "bg-btn-primary-hover"],
  ["bg-zinc-700", "bg-btn-primary-hover"],
  ["bg-red-500", "bg-btn-danger"],
  ["bg-red-600", "bg-btn-danger-hover"],
  ["bg-green-100", "bg-accent-green-bg"],
  ["bg-red-100", "bg-accent-red-bg"],
  ["text-zinc-900", "text-text-primary"],
  ["text-zinc-800", "text-text-primary"],
  ["text-zinc-700", "text-text-secondary"],
  ["text-zinc-600", "text-text-tertiary"],
  ["text-zinc-500", "text-text-muted"],
  ["text-zinc-400", "text-text-faint"],
  ["text-white", "text-text-inverse"],
  ["text-red-500", "text-accent-red"],
  ["text-green-700", "text-accent-green-text"],
  ["border-zinc-200", "border-border-default"],
  ["border-zinc-300", "border-border-input"],
  ["border-zinc-100", "border-border-subtle"],
  ["border-zinc-400", "border-border-focus"],
  ["hover:bg-zinc-50", "hover:bg-bg-base"],
  ["hover:bg-zinc-100", "hover:bg-bg-muted"],
  ["hover:bg-zinc-200", "hover:bg-bg-subtle"],
  ["hover:bg-zinc-700", "hover:bg-btn-primary-hover"],
  ["hover:bg-zinc-800", "hover:bg-btn-primary-hover"],
  ["hover:bg-red-100", "hover:bg-accent-red-bg"],
  ["hover:bg-red-600", "hover:bg-btn-danger-hover"],
  ["hover:text-zinc-600", "hover:text-text-tertiary"],
  ["hover:text-zinc-900", "hover:text-text-primary"],
  ["hover:text-red-500", "hover:text-accent-red"],
  ["focus:border-zinc-400", "focus:border-border-focus"],
];

const SKIP = new Set([
  "Card.tsx", "Button.tsx", "ConfirmModal.tsx",
  "Navigation.tsx", "FilterBar.tsx", "DataTimestamp.tsx",
]);

function walk(dir, results) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, results);
    else if ((entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) && !SKIP.has(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const files = walk(path.resolve("src"), []);
let total = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf-8");
  let changed = false;
  for (const [old, rep] of replacements) {
    // Simple string replace — only in className contexts
    if (content.includes(old)) {
      content = content.split(old).join(rep);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, content, "utf-8");
    total++;
    console.log("Updated:", path.relative(".", file));
  }
}
console.log("\nTotal:", total, "files");
