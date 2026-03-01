const args = new Set(Bun.argv.slice(2));

const getArgValue = (flag: string): string | undefined => {
  const list = Bun.argv.slice(2);
  const idx = list.indexOf(flag);
  if (idx < 0) return undefined;
  return list[idx + 1];
};

const namespace = getArgValue("--namespace");
const yes = args.has("--yes");
const test = args.has("--test");
const shadow = args.has("--shadow");

const target = [
  namespace ? `namespace=${namespace}` : "namespace=active",
  test ? "cluster=test" : "cluster=primary",
  shadow ? "shadow=true" : "shadow=false",
].join(", ");

if (!yes) {
  console.error(`[reset-db] refusing to run without --yes (${target})`);
  console.error("[reset-db] usage: bun run scripts/reset-db.ts --yes [--namespace <name>] [--test] [--shadow]");
  process.exit(1);
}

const cmd = ["db", "reset", "--all"];
if (namespace) cmd.push("--namespace", namespace);
if (test) cmd.push("--test");
if (shadow) cmd.push("--shadow");

console.log(`[reset-db] running: encore ${cmd.join(" ")}`);
const proc = Bun.spawn(["encore", ...cmd], {
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});

const code = await proc.exited;
if (code !== 0) {
  console.error(`[reset-db] failed with exit code ${code}`);
  process.exit(code);
}
console.log("[reset-db] database reset complete");
