import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const blogRoot = join(import.meta.dirname, "..");
const cangjieGrammar = join(blogRoot, "shiki-languages", "cangjie.tmLanguage.json");
const cangjieDarkTheme = join(blogRoot, "shiki-themes", "cangjie-theme-dark.json");

test("custom cangjie grammar highlights builtin numeric types like other builtin types", async () => {
  const { createHighlighter } = await import("shiki");
  const highlighter = await createHighlighter({
    langs: [JSON.parse(readFileSync(cangjieGrammar, "utf8"))],
    themes: [JSON.parse(readFileSync(cangjieDarkTheme, "utf8"))],
  });

  try {
    const [stringLine, floatLine] = highlighter.codeToTokensBase(
      'let s: String = "x"\nlet f: Float64 = 1.0',
      {
        lang: "cangjie",
        theme: "Cangjie Theme Dark",
      },
    );
    const keywordColor = stringLine.find((token) => token.content === "let")?.color;
    const stringTypeColor = stringLine.find((token) => token.content === "String")?.color;
    const floatTypeColor = floatLine.find((token) => token.content === "Float64")?.color;

    assert.ok(keywordColor, "expected to find a keyword token color");
    assert.ok(stringTypeColor, "expected to find a String token color");
    assert.ok(floatTypeColor, "expected to find a Float64 token color");
    assert.equal(floatTypeColor, stringTypeColor);
    assert.notEqual(floatTypeColor, keywordColor);
  } finally {
    await highlighter.dispose?.();
  }
});
