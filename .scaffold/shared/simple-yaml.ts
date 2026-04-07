import fs from "node:fs";

export type SimpleSchema =
  | {
      type?: "object";
      required?: string[];
      properties?: Record<string, SimpleSchema>;
      enum?: unknown[];
    }
  | {
      type?: "array";
      items?: SimpleSchema;
      enum?: unknown[];
    }
  | {
      type?: "string" | "integer" | "number" | "boolean";
      enum?: unknown[];
    }
  | {
      type?: string;
      enum?: unknown[];
    };

type NormalizedYamlLine = {
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
      if (char === quote) quote = null;
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
      if (item) items.push(item);
      current = "";
      continue;
    }
    current += char;
  }

  const tail = current.trim();
  if (tail) items.push(tail);
  return items;
}

function parseScalar(value: string): unknown {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text === "true" || text === "false") return text === "true";
  if (text === "null" || text === "~") return null;
  if (text === "[]") return [];
  if (text === "{}") return {};
  if (text.startsWith("[") && text.endsWith("]")) {
    const inner = text.slice(1, -1).trim();
    return inner ? splitInlineItems(inner).map((item) => parseScalar(item)) : [];
  }
  if (text.startsWith("{") && text.endsWith("}")) {
    const inner = text.slice(1, -1).trim();
    if (!inner) return {};
    return Object.fromEntries(
      splitInlineItems(inner).map((item) => {
        const [key, raw = ""] = item.split(/:(.+)/, 2);
        return [key.trim(), parseScalar(raw)];
      }),
    );
  }
  if (/^-?\d+$/.test(text)) return Number.parseInt(text, 10);
  if (/^-?\d+\.\d+$/.test(text)) return Number.parseFloat(text);
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.startsWith('"') ? JSON.parse(text) : text.slice(1, -1);
  }
  return text;
}

function normalizeLines(text: string): NormalizedYamlLine[] {
  return String(text || "")
    .split(/\r?\n/)
    .map((raw) => ({
      indent: raw.length - raw.trimStart().length,
      content: raw.trim(),
    }))
    .filter((line) => line.content && !line.content.startsWith("#"));
}

function parseBlock(lines: NormalizedYamlLine[], index: number, indent: number): [unknown, number] {
  if (index >= lines.length) return [{}, index];
  if (lines[index]?.content.startsWith("-")) return parseList(lines, index, indent);
  return parseMapping(lines, index, indent);
}

function parseMapping(lines: NormalizedYamlLine[], index: number, indent: number): [Record<string, unknown>, number] {
  const result: Record<string, unknown> = {};
  let cursor = index;

  while (cursor < lines.length) {
    const line = lines[cursor];
    if (!line || line.indent < indent || line.indent !== indent || line.content.startsWith("-")) break;

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

function parseList(lines: NormalizedYamlLine[], index: number, indent: number): [unknown[], number] {
  const result: unknown[] = [];
  let cursor = index;

  while (cursor < lines.length) {
    const line = lines[cursor];
    if (!line || line.indent < indent || line.indent !== indent || !line.content.startsWith("-")) break;

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

    const mappingMatch = remainder.match(/^([A-Za-z0-9_.-]+):(.*)$/);
    if (mappingMatch) {
      const item: Record<string, unknown> = {};
      const key = mappingMatch[1].trim();
      const value = mappingMatch[2].trimStart();
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

export function parseSimpleYaml(text: string) {
  const lines = normalizeLines(text);
  if (!lines.length) return {};
  const [payload] = parseBlock(lines, 0, lines[0].indent);
  return payload;
}

export function loadSimpleYamlFile<T = unknown>(filePath: string): T {
  return parseSimpleYaml(fs.readFileSync(filePath, "utf8")) as T;
}

export function validateSimpleSchema(payload: unknown, schema: SimpleSchema, pointer = "root"): string[] {
  const errors: string[] = [];
  const expectedType = schema?.type;

  if (expectedType === "object") {
    const objectSchema = schema as Extract<SimpleSchema, { type?: "object" }>;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [`${pointer}: expected object`];
    const record = payload as Record<string, unknown>;
    for (const field of objectSchema.required || []) {
      if (!(field in record)) errors.push(`${pointer}.${field}: missing required field`);
    }
    for (const [key, value] of Object.entries(record)) {
      if (objectSchema.properties?.[key]) {
        errors.push(...validateSimpleSchema(value, objectSchema.properties[key] as SimpleSchema, `${pointer}.${key}`));
      }
    }
    if (Array.isArray(objectSchema.enum) && !objectSchema.enum.includes(payload)) {
      errors.push(`${pointer}: expected one of ${objectSchema.enum.join(", ")}`);
    }
    return errors;
  }

  if (expectedType === "array") {
    const arraySchema = schema as Extract<SimpleSchema, { type?: "array" }>;
    if (!Array.isArray(payload)) return [`${pointer}: expected array`];
    if (arraySchema.items) {
      payload.forEach((item, index) => {
        errors.push(...validateSimpleSchema(item, arraySchema.items as SimpleSchema, `${pointer}[${index}]`));
      });
    }
    if (Array.isArray(arraySchema.enum) && !arraySchema.enum.includes(payload)) {
      errors.push(`${pointer}: expected one of ${arraySchema.enum.join(", ")}`);
    }
    return errors;
  }

  if (expectedType === "string" && typeof payload !== "string") return [`${pointer}: expected string`];
  if (expectedType === "integer" && (!Number.isInteger(payload) || typeof payload !== "number")) {
    return [`${pointer}: expected integer`];
  }
  if (expectedType === "number" && typeof payload !== "number") return [`${pointer}: expected number`];
  if (expectedType === "boolean" && typeof payload !== "boolean") return [`${pointer}: expected boolean`];

  if (Array.isArray(schema?.enum) && !schema.enum.includes(payload)) {
    errors.push(`${pointer}: expected one of ${schema.enum.join(", ")}`);
  }

  return errors;
}
