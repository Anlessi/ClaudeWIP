// PreToolUse hook: block `gh pr create` until the wrap-up skill has written the pull request description.
// The description file (--body-file) must contain a "## Decisions" section. See CLAUDE.md "Decisions and context".
const fs = require("fs");
const path = require("path");

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const command = (input.tool_input && input.tool_input.command) || "";
  const create = command.match(/\bgh(\.exe)?["']?\s+pr\s+create\b/);
  if (!create) process.exit(0);

  const block = (reason) => {
    process.stderr.write(reason + "\n");
    process.exit(2);
  };

  // Only look after `gh pr create`, so a --body-file mentioned earlier (e.g. in a commit message) is ignored.
  const match = command.slice(create.index).match(/--body-file[=\s]+(?:"([^"]+)"|'([^']+)'|(\S+))/);
  if (!match) {
    block(
      "Blocked by .claude/hooks/require-wrap-up.js: open pull requests with --body-file <file> (see CLAUDE.md), " +
        "after running the wrap-up skill (/wrap-up).",
    );
  }
  const file = path.resolve(input.cwd || process.cwd(), match[1] || match[2] || match[3]);
  let body;
  try {
    body = fs.readFileSync(file, "utf8");
  } catch {
    block(
      `Blocked by .claude/hooks/require-wrap-up.js: can't read the description file ${file}. ` +
        "Write the full path after --body-file: this hook sees the command before the shell expands variables " +
        "such as $S or $env:TEMP.",
    );
  }
  if (!/^##\s+Decisions\s*$/m.test(body)) {
    block(
      "Blocked by .claude/hooks/require-wrap-up.js: the pull request description has no '## Decisions' section. " +
        "Run the wrap-up skill (/wrap-up) first: it records decisions, updates CONTEXT.md and IDEAS.md, and " +
        "writes the description.",
    );
  }
  process.exit(0);
});
