export type MessageTree = { [key: string]: string | MessageTree };

/**
 * Flatten a nested messages object into dotted-path → string entries,
 * preserving insertion order.
 */
export function flattenMessages(
  tree: MessageTree,
  prefix = ""
): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result.set(path, value);
    } else {
      for (const [childPath, childValue] of flattenMessages(value, path)) {
        result.set(childPath, childValue);
      }
    }
  }
  return result;
}

/**
 * Set a dotted-path value in a nested messages object (mutates).
 * Only overwrites existing string leaves — the file structure defines
 * where keys live; overrides for unknown paths are ignored by callers.
 */
export function setMessageAtPath(
  tree: MessageTree,
  path: string,
  value: string
): boolean {
  const segments = path.split(".");
  let node: MessageTree = tree;
  for (let i = 0; i < segments.length - 1; i++) {
    const next = node[segments[i]];
    if (typeof next !== "object" || next === null) return false;
    node = next;
  }
  const leaf = segments[segments.length - 1];
  if (typeof node[leaf] !== "string") return false;
  node[leaf] = value;
  return true;
}

/** Extract ICU argument names with their type (plural/select/other). */
export function extractIcuArguments(
  message: string
): Array<{ name: string; type: "plural" | "select" | "value" }> {
  const args = new Map<string, "plural" | "select" | "value">();
  const re = /\{\s*(\w+)\s*(?:,\s*(\w+))?/g;
  let match;
  while ((match = re.exec(message)) !== null) {
    const [, name, kind] = match;
    const type =
      kind === "plural" ? "plural" : kind === "select" ? "select" : "value";
    // plural/select win over a plain reuse of the same variable
    if (!args.has(name) || type !== "value") args.set(name, type);
  }
  return [...args.entries()].map(([name, type]) => ({ name, type }));
}

/** Extract rich-text tag names like <strong>...</strong>. */
export function extractTags(message: string): string[] {
  const tags = new Set<string>();
  const re = /<(\w+)>/g;
  let match;
  while ((match = re.exec(message)) !== null) {
    tags.add(match[1]);
  }
  return [...tags];
}
