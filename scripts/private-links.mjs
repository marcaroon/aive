import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd());
const origin = new URL(process.argv[2] || "http://localhost:3000");
if (!["http:", "https:"].includes(origin.protocol))
  throw new Error("Use an http or https app URL.");
const lines = [
  "# Personal Aive links",
  "",
  "Keep this file private. Each link grants access to its person's space.",
  "",
  "Open the correct link once on each device. Access is remembered for 180 days.",
  "",
];
for (const [name, variable] of [
  ["Aivel", "AIVE_PRIMARY_LINK_KEY"],
  ["Ammar", "AIVE_PARTNER_LINK_KEY"],
]) {
  const key = process.env[variable];
  if (!key || key.length < 32)
    throw new Error(
      `Set ${variable} to a random key of at least 32 characters in .env.local.`,
    );
  const url = new URL("/open", origin);
  url.hash = new URLSearchParams({ key }).toString();
  lines.push(`- [Open ${name}'s space](${url.href})`);
}
const output = path.resolve("PRIVATE_LINKS.local.md");
fs.writeFileSync(output, lines.join("\n") + "\n", { mode: 0o600 });
process.stdout.write(
  "Personal links saved to PRIVATE_LINKS.local.md. Do not commit or publish that file.\n",
);
