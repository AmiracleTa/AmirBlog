"use strict";

const path = require("node:path");
const { readFile } = require("node:fs/promises");
const { escapeHTML } = require("hexo-util");
const { bundledLanguages, createHighlighter } = require("shiki");

const escapeAttr = (value) =>
  String(value ?? "code")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "code";

const languageAliases = {
  code: "text",
  config: "nginx",
  plain: "text",
  plaintext: "text",
};

const resolveConfigPath = (filePath) =>
  path.isAbsolute(filePath) ? filePath : path.resolve(hexo.base_dir, filePath);

const stripSharedIndent = (code) => {
  const normalizedCode = String(code ?? "").replace(/\r\n?/g, "\n");
  const lines = normalizedCode.split("\n");
  const indents = lines
    .filter((line) => line.trim() !== "")
    .map((line) => line.match(/^[\t ]*/)?.[0] ?? "");

  if (indents.length === 0) {
    return normalizedCode;
  }

  let sharedIndent = indents[0];
  for (const indent of indents.slice(1)) {
    let prefixLength = 0;
    while (
      prefixLength < sharedIndent.length &&
      prefixLength < indent.length &&
      sharedIndent[prefixLength] === indent[prefixLength]
    ) {
      prefixLength += 1;
    }
    sharedIndent = sharedIndent.slice(0, prefixLength);
    if (sharedIndent === "") {
      return normalizedCode;
    }
  }

  if (sharedIndent === "") {
    return normalizedCode;
  }

  return lines
    .map((line) =>
      line.trim() === "" || !line.startsWith(sharedIndent)
        ? line
        : line.slice(sharedIndent.length),
    )
    .join("\n");
};

const getLineNumberDigits = (code) =>
  String(Math.max(String(code ?? "").split("\n").length, 1)).length;

const applyLineNumberStyles = (html, code) => {
  const lineNumberDigits = getLineNumberDigits(code);
  const lineNumberStyle = `--shiki-line-number-digits:${lineNumberDigits};--shiki-gutter-width:min(2.3rem, calc(${lineNumberDigits}ch + 1.1rem))`;

  return html.replace(/<pre\b([^>]*)>/, (match, attrs) => {
    if (/style="/.test(attrs)) {
      return `<pre${attrs.replace(
        /style="([^"]*)"/,
        (styleMatch, styleValue) => `style="${styleValue};${lineNumberStyle}"`,
      )}>`;
    }

    return `<pre${attrs} style="${lineNumberStyle}">`;
  });
};

const loadTheme = async (theme) => {
  if (typeof theme === "string") {
    return { loaded: theme, active: theme };
  }

  const themeContent = JSON.parse(
    await readFile(resolveConfigPath(theme.path), "utf8"),
  );
  const name = theme.name || themeContent.name;

  return {
    loaded: {
      ...themeContent,
      name,
    },
    active: name,
  };
};

const loadLanguage = async (language) => {
  if (typeof language === "string") {
    return language;
  }

  const languageContent = JSON.parse(
    await readFile(resolveConfigPath(language.path), "utf8"),
  );

  return {
    ...languageContent,
    name: language.name || languageContent.name || "custom",
  };
};

const shikiConfig = hexo.config.shiki ?? {};
const configuredLanguages = Array.isArray(shikiConfig.languages)
  ? shikiConfig.languages
  : [];
const loadAllLanguages = shikiConfig.loadAllLanguages !== false;

const loadedLanguages = await Promise.all(configuredLanguages.map(loadLanguage));
const configuredLanguageNames = new Set(
  configuredLanguages.map((language) =>
    typeof language === "string" ? language : language.name,
  ),
);

const requiredAliasTargets = new Set(
  Object.values(languageAliases).filter((language) =>
    Object.prototype.hasOwnProperty.call(bundledLanguages, language),
  ),
);

const bundledLanguageList = loadAllLanguages
  ? Object.keys(bundledLanguages)
  : [...requiredAliasTargets].filter(
      (language) => !configuredLanguageNames.has(language),
    );

const themeMode =
  shikiConfig.theme != null
    ? {
        theme: await loadTheme(shikiConfig.theme),
      }
    : shikiConfig.themes
      ? {
          themes: {
            light: await loadTheme(shikiConfig.themes.light),
            dark: await loadTheme(shikiConfig.themes.dark),
          },
        }
      : {
          theme: { loaded: "github-light", active: "github-light" },
        };

const highlighter = await createHighlighter({
  themes:
    "theme" in themeMode
      ? [themeMode.theme.loaded]
      : [themeMode.themes.light.loaded, themeMode.themes.dark.loaded],
  langs: [...loadedLanguages, ...bundledLanguageList],
});

const renderOptions =
  "theme" in themeMode
    ? { theme: themeMode.theme.active }
    : {
        themes: {
          light: themeMode.themes.light.active,
          dark: themeMode.themes.dark.active,
        },
      };

const wrapInHighlightFigure = (html, options) => {
  if (/^\s*<figure\b/i.test(html)) {
    return html;
  }

  const caption = options?.caption ? `<figcaption>${options.caption}</figcaption>` : "";
  return `<figure class="highlight">${caption}${html}</figure>`;
};

hexo.extend.highlight.register("shiki", function shikiHighlighter(code, options = {}) {
  const lang = escapeAttr(options.lang);
  const renderLang = languageAliases[lang] || lang || "text";
  const normalizedCode = stripSharedIndent(code);

  try {
    let html = highlighter.codeToHtml(normalizedCode, {
      ...renderOptions,
      lang: renderLang,
    });

    html = applyLineNumberStyles(html, normalizedCode);

    if (html.includes("data-language=")) {
      return wrapInHighlightFigure(html, options);
    }

    html = html.replace(
      /<pre\b([^>]*)class="([^"]*)"/,
      `<pre data-language="${lang}"$1 class="language-${lang} $2"`,
    );

    return wrapInHighlightFigure(html, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    hexo.log.warn(`[shiki-highlight] ${message}`);

    const fallbackLang = lang === "code" ? "" : ` language-${lang}`;
    return wrapInHighlightFigure(
      applyLineNumberStyles(
        `<pre data-language="${lang}" class="shiki${fallbackLang}"><code>${escapeHTML(normalizedCode)}</code></pre>`,
        normalizedCode,
      ),
      options,
    );
  }
});

if (
  hexo.config.syntax_highlighter === "shiki" &&
  "themes" in themeMode &&
  shikiConfig.autoInjectCSS !== false
) {
  const css =
    shikiConfig.autoInjectCSS === "selector"
      ? `
${shikiConfig.darkSelector || "html.dark"} .shiki,
${shikiConfig.darkSelector || "html.dark"} .shiki span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
      `
      : `
@media (prefers-color-scheme: dark) {
  .shiki,
  .shiki span {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
    font-style: var(--shiki-dark-font-style) !important;
    font-weight: var(--shiki-dark-font-weight) !important;
    text-decoration: var(--shiki-dark-text-decoration) !important;
  }
}
      `;

  hexo.extend.injector.register("head_end", `<style>${css}</style>`);
}
