import assert from "node:assert/strict"
import { test } from "node:test"
import { parseTheme } from "./theme.ts"

test("parseTheme accepts only light and dark", () => {
  assert.equal(parseTheme("light"), "light")
  assert.equal(parseTheme("dark"), "dark")
  assert.equal(parseTheme("blue"), null)
  assert.equal(parseTheme(null), null)
})
