import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const blogRoot = join(import.meta.dirname, "..");
const publicRoot = join(blogRoot, "public");
const themeMainJs = join(blogRoot, "themes", "anzhiyu", "source", "js", "main.js");
const themeStylusEventJs = join(
  blogRoot,
  "themes",
  "anzhiyu",
  "scripts",
  "events",
  "stylus.js",
);
const themeHighlightStyl = join(
  blogRoot,
  "themes",
  "anzhiyu",
  "source",
  "css",
  "_highlight",
  "highlight",
  "index.styl",
);
const themeHighlightMainStyl = join(
  blogRoot,
  "themes",
  "anzhiyu",
  "source",
  "css",
  "_highlight",
  "highlight.styl",
);
const shikiHighlighterScript = join(blogRoot, "scripts", "shiki-highlight.js");

let buildAttempted = false;
let buildStatus = null;
let buildOutput = "";

function runHexo(command) {
  return spawnSync("npx", ["hexo", command], {
    cwd: blogRoot,
    encoding: "utf8",
  });
}

function ensureGenerated() {
  if (buildAttempted) {
    return;
  }

  buildAttempted = true;

  const clean = runHexo("clean");
  assert.equal(clean.status, 0, clean.stderr || clean.stdout);

  const generate = runHexo("generate");
  buildStatus = generate.status;
  buildOutput = generate.stderr || generate.stdout;
  assert.equal(generate.status, 0, buildOutput);
}

function collectHtmlFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectHtmlFiles(fullPath);
    }

    return entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

function findRenderedHtml(pattern) {
  return collectHtmlFiles(publicRoot)
    .map((file) => readFileSync(file, "utf8"))
    .find((html) => pattern.test(html));
}

test("hexo generate renders cangjie blocks with shiki language metadata", () => {
  ensureGenerated();

  const cangjieHtml = findRenderedHtml(/data-language="cangjie"/);
  assert.ok(
    cangjieHtml,
    `expected generated html with data-language="cangjie"; build status=${buildStatus}, output=${buildOutput}`,
  );
  assert.match(
    cangjieHtml,
    /class="[^"]*shiki[^"]*language-cangjie|class="[^"]*language-cangjie[^"]*shiki/,
  );
  assert.match(cangjieHtml, /"plugin":"shiki"/);
});

test("hexo generate still renders common cpp blocks through shiki", () => {
  ensureGenerated();

  const cppHtml = findRenderedHtml(/data-language="cpp"/);
  assert.ok(cppHtml, "expected generated html with data-language=\"cpp\"");
  assert.match(
    cppHtml,
    /class="[^"]*shiki[^"]*language-cpp|class="[^"]*language-cpp[^"]*shiki/,
  );
});

test("hexo generate applies the configured shiki theme colors", () => {
  ensureGenerated();

  const cangjieHtml = findRenderedHtml(/data-language="cangjie"/);
  assert.ok(cangjieHtml, "expected generated html with data-language=\"cangjie\"");
  assert.match(cangjieHtml, /background-color:#fafafa;--shiki-dark-bg:#282c34/i);
});

test("hexo generate applies custom cangjie token colors instead of fallback gray", () => {
  ensureGenerated();

  const cangjieHtml = findRenderedHtml(/data-language="cangjie"/);
  assert.ok(cangjieHtml, "expected generated html with data-language=\"cangjie\"");
  assert.match(cangjieHtml, /color:#AF00DB;[^"]*--shiki-dark:#C586C0/i);
  assert.match(cangjieHtml, /color:#001080;--shiki-dark:#9CDCFE/i);
});

test("hexo generate wraps shiki blocks in the theme highlight container", () => {
  ensureGenerated();

  const cangjieHtml = findRenderedHtml(/data-language="cangjie"/);
  assert.ok(cangjieHtml, "expected generated html with data-language=\"cangjie\"");
  assert.match(
    cangjieHtml,
    /<figure class="highlight">\s*<pre data-language="cangjie"/i,
  );
});

test("anzhiyu main.js includes a dedicated shiki code block branch", () => {
  const source = readFileSync(themeMainJs, "utf8");

  assert.match(source, /plugin === "shiki"/);
  assert.match(source, /document\.querySelectorAll\("pre\.shiki"\)/);
});

test("anzhiyu stylus renderer enables highlight styles for shiki", () => {
  const source = readFileSync(themeStylusEventJs, "utf8");

  assert.match(
    source,
    /highlightEnable\s*=\s*\[.*"highlight\.js".*"shiki".*\]\.includes\(syntaxHighlighter\)/s,
  );
});

test("anzhiyu mac highlight theme does not add an extra drop shadow below code blocks", () => {
  const source = readFileSync(themeHighlightMainStyl, "utf8");

  assert.doesNotMatch(source, /box-shadow:\s*0 5px 10px 0 \$highlight-mac-border/);
});

test("anzhiyu highlight styles add line numbers for shiki blocks", () => {
  const source = readFileSync(themeHighlightStyl, "utf8");

  assert.match(source, /pre\.shiki/);
  assert.match(source, /counter-reset:\s*line/);
  assert.match(source, /\.line[\s\S]*&:before[\s\S]*content:\s*counter\(line\)/);
});

test("anzhiyu highlight styles use a per-block gutter width variable for shiki", () => {
  const source = readFileSync(themeHighlightStyl, "utf8");

  assert.match(source, /var\(--shiki-gutter-width,\s*\$shiki-gutter-width\)/);
  assert.match(
    source,
    /\.line[\s\S]*padding-left:\s*calc\(var\(--shiki-gutter-width,\s*\$shiki-gutter-width\) \+ \.5rem\)/,
  );
});

test("anzhiyu highlight styles normalize shiki line whitespace", () => {
  const source = readFileSync(themeHighlightStyl, "utf8");

  assert.match(source, /pre\.shiki[\s\S]*code[\s\S]*white-space:\s*normal/);
  assert.match(source, /\.line[\s\S]*white-space:\s*pre/);
});

test("anzhiyu highlight styles keep empty shiki lines tall enough for line numbers", () => {
  const source = readFileSync(themeHighlightStyl, "utf8");

  assert.match(source, /\.line[\s\S]*&:empty/);
  assert.match(source, /&:empty[\s\S]*&:after[\s\S]*content:\s*['"]\s['"]/);
});

test("shiki highlighter trims shared leading indentation before rendering", () => {
  const source = readFileSync(shikiHighlighterScript, "utf8");

  assert.match(source, /const stripSharedIndent =/);
  assert.match(source, /const normalizedCode = stripSharedIndent\(code\)/);
  assert.match(source, /codeToHtml\(normalizedCode,/);
  assert.match(source, /escapeHTML\(normalizedCode\)/);
});

test("shiki highlighter injects a computed gutter width style for line numbers", () => {
  const source = readFileSync(shikiHighlighterScript, "utf8");

  assert.match(source, /const getLineNumberDigits =/);
  assert.match(
    source,
    /--shiki-line-number-digits:\$\{lineNumberDigits\};--shiki-gutter-width:[^`]*\$\{lineNumberDigits\}ch \+ 1\.1rem[^`]*/,
  );
  assert.match(source, /const applyLineNumberStyles =/);
  assert.match(source, /html = applyLineNumberStyles\(html,\s*normalizedCode\)/);
  assert.match(source, /applyLineNumberStyles\(\s*`<pre data-language="\$\{lang\}"/);
});

test("anzhiyu highlight styles let shiki blocks inherit the white figure background", () => {
  const source = readFileSync(themeHighlightStyl, "utf8");

  assert.match(source, /pre\.shiki[\s\S]*background:\s*transparent\s*!important/);
  assert.match(source, /pre\.shiki[\s\S]*background-color:\s*transparent\s*!important/);
});

test("anzhiyu highlight styles remove the inherited bottom padding from shiki pre blocks", () => {
  const source = readFileSync(themeHighlightStyl, "utf8");

  assert.match(source, /pre\.shiki[\s\S]*padding-bottom:\s*0/);
});

test("anzhiyu highlight styles paint a full-height gutter for shiki line numbers", () => {
  const source = readFileSync(themeHighlightStyl, "utf8");

  assert.match(source, /pre\.shiki[\s\S]*position:\s*relative/);
  assert.match(
    source,
    /pre\.shiki[\s\S]*&:before[\s\S]*top:\s*0[\s\S]*bottom:\s*0[\s\S]*left:\s*0[\s\S]*width:\s*var\(--shiki-gutter-width,\s*\$shiki-gutter-width\)/,
  );
  assert.match(
    source,
    /pre\.shiki[\s\S]*&:before[\s\S]*if \$highlight_theme == 'light' \|\| \(\$highlight_theme == 'mac light'\)[\s\S]*border-right:\s*var\(--style-border-always\)/,
  );
});

test("hexo generate does not emit missing shiki language warnings for config fences", () => {
  ensureGenerated();

  assert.doesNotMatch(buildOutput, /Language `config` not found/);
});
