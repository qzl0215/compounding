type YamlLine = {
  indent: number;
  content: string;
};

function splitInlineItems(text: string) {
  const items: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let depth = 0;

  for (const char of text) {
    if (quote) {
      current += char;
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "[" || char === "{") {
      depth += 1;
      current += char;
      continue;
    }

    if (char === "]" || char === "}") {
      depth = Math.max(0, depth - 1);
      current += char;
      continue;
    }

    if (char === "," && depth === 0) {
      const item = current.trim();
      if (item) {
        items.push(item);
      }
      current = "";
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail) {
    items.push(tail);
  }
  return items;
}

function parseScalar(value: string): unknown {
  const text = value.trim();
  if (!text) {
    return "";
  }
  if (text === "true" || text === "false") {
    return text === "true";
  }
  if (text === "null" || text === "~") {
    return null;
  }
  if (text === "[]") {
    return [];
  }
  if (text === "{}") {
    return {};
  }
  if (text.startsWith("[") && text.endsWith("]")) {
    const inner = text.slice(1, -1).trim();
    return inner ? splitInlineItems(inner).map((item) => parseScalar(item)) : [];
  }
  if (text.startsWith("{") && text.endsWith("}")) {
    const inner = text.slice(1, -1).trim();
    if (!inner) {
      return {};
    }
    return Object.fromEntries(
      splitInlineItems(inner).map((item) => {
        const [key, raw = ""] = item.split(/:(.+)/, 2);
        return [key.trim(), parseScalar(raw)];
      }),
    );
  }
  if (/^-?\d+$/.test(text)) {
    return Number.parseInt(text, 10);
  }
  if (/^-?\d+\.\d+$/.test(text)) {
    return Number.parseFloat(text);
  }
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.startsWith('"') ? JSON.parse(text) : text.slice(1, -1);
  }
  return text;
}

function normalizeLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((raw) => ({
      indent: raw.length - raw.trimStart().length,
      content: raw.trim(),
    }))
    .filter((line) => line.content && !line.content.startsWith("#"));
}

function parseBlock(lines: YamlLine[], index: number, indent: number): [unknown, number] {
  if (index >= lines.length) {
    return [{}, index];
  }
  if (lines[index]?.content.startsWith("-")) {
    return parseList(lines, index, indent);
  }
  return parseMapping(lines, index, indent);
}

function parseMapping(lines: YamlLine[], index: number, indent: number): [Record<string, unknown>, number] {
  const result: Record<string, unknown> = {};
  let cursor = index;

  while (cursor < lines.length) {
    const line = lines[cursor];
    if (!line || line.indent < indent || line.indent !== indent || line.content.startsWith("-")) {
      break;
    }

    const colonIndex = line.content.indexOf(":");
    if (colonIndex === -1) {
      throw new Error(`Invalid YAML mapping line: ${line.content}`);
    }
    const key = line.content.slice(0, colonIndex).trim();
    const value = line.content.slice(colonIndex + 1).trimStart();
    cursor += 1;

    if (!value) {
      if (cursor < lines.length && lines[cursor].indent > indent) {
        const [child, next] = parseBlock(lines, cursor, lines[cursor].indent);
        result[key] = child;
        cursor = next;
      } else {
        result[key] = null;
      }
      continue;
    }

    result[key] = parseScalar(value);
  }

  return [result, cursor];
}

function parseList(lines: YamlLine[], index: number, indent: number): [unknown[], number] {
  const result: unknown[] = [];
  let cursor = index;

  while (cursor < lines.length) {
    const line = lines[cursor];
    if (!line || line.indent < indent || line.indent !== indent || !line.content.startsWith("-")) {
      break;
    }

    const remainder = line.content.slice(1).trimStart();
    cursor += 1;

    if (!remainder) {
      if (cursor < lines.length && lines[cursor].indent > indent) {
        const [child, next] = parseBlock(lines, cursor, lines[cursor].indent);
        result.push(child);
        cursor = next;
      } else {
        result.push(null);
      }
      continue;
    }

    const colonIndex = remainder.indexOf(":");
    if (colonIndex !== -1) {
      const item: Record<string, unknown> = {};
      const key = remainder.slice(0, colonIndex).trim();
      const value = remainder.slice(colonIndex + 1).trimStart();
      if (!value) {
        if (cursor < lines.length && lines[cursor].indent > indent) {
          const [child, next] = parseBlock(lines, cursor, lines[cursor].indent);
          item[key] = child;
          cursor = next;
        } else {
          item[key] = null;
        }
      } else {
        item[key] = parseScalar(value);
      }

      if (cursor < lines.length && lines[cursor].indent > indent) {
        const [extra, next] = parseMapping(lines, cursor, lines[cursor].indent);
        Object.assign(item, extra);
        cursor = next;
      }
      result.push(item);
      continue;
    }

    result.push(parseScalar(remainder));
  }

  return [result, cursor];
}

export function parseSimpleYaml(text: string): unknown {
  const lines = normalizeLines(text);
  if (!lines.length) {
    return {};
  }
  const [payload] = parseBlock(lines, 0, lines[0].indent);
  return payload;
}
