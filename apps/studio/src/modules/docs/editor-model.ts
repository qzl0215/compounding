export type EditableBlock =
  | { id: string; type: "heading"; level: 1 | 2 | 3; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "unordered_list"; items: string[] }
  | { id: string; type: "ordered_list"; items: string[] }
  | { id: string; type: "blockquote"; text: string }
  | { id: string; type: "code"; language: string; text: string }
  | { id: string; type: "table"; rows: string[][] }
  | { id: string; type: "hr" }
  | { id: string; type: "raw"; text: string };

export function parseEditableMarkdown(markdown: string): EditableBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: EditableBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({
        id: blockId(blocks.length),
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim(),
      });
      index += 1;
      continue;
    }

    if (/^(```|~~~)/.test(line.trim())) {
      const fence = line.trim().slice(0, 3);
      const language = line.trim().slice(3).trim();
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith(fence)) {
        body.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({ id: blockId(blocks.length), type: "code", language, text: body.join("\n") });
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(line.trim())) {
      blocks.push({ id: blockId(blocks.length), type: "hr" });
      index += 1;
      continue;
    }

    if (looksLikeTable(lines, index)) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }
      const normalized = rows.filter((row) => row.some((cell) => cell.trim()));
      const withoutDivider =
        normalized.length >= 2 && isAlignmentRow(normalized[1]) ? [normalized[0], ...normalized.slice(2)] : normalized;
      blocks.push({ id: blockId(blocks.length), type: "table", rows: withoutDivider });
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const body: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        body.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      blocks.push({ id: blockId(blocks.length), type: "blockquote", text: body.join("\n").trimEnd() });
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*-\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*-\s+/, "").trimEnd());
        index += 1;
      }
      blocks.push({ id: blockId(blocks.length), type: "unordered_list", items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, "").trimEnd());
        index += 1;
      }
      blocks.push({ id: blockId(blocks.length), type: "ordered_list", items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^(```|~~~)/.test(lines[index].trim()) &&
      !/^(-{3,}|\*{3,})\s*$/.test(lines[index].trim()) &&
      !/^\s*>\s?/.test(lines[index]) &&
      !/^\s*-\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index]) &&
      !looksLikeTable(lines, index)
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push({ id: blockId(blocks.length), type: "paragraph", text: paragraph.join("\n").trimEnd() });
  }

  return blocks;
}

export function stringifyEditableMarkdown(blocks: EditableBlock[]) {
  return `${blocks
    .map((block) => renderBlock(block))
    .filter(Boolean)
    .join("\n\n")
    .trim()}\n`;
}

function renderBlock(block: EditableBlock) {
  switch (block.type) {
    case "heading":
      return block.text.trim() ? `${"#".repeat(block.level)} ${block.text.trim()}` : "";
    case "paragraph":
      return block.text.trim();
    case "unordered_list":
      return block.items.filter(Boolean).map((item) => `- ${item.trimEnd()}`).join("\n");
    case "ordered_list":
      return block.items.filter(Boolean).map((item, index) => `${index + 1}. ${item.trimEnd()}`).join("\n");
    case "blockquote":
      return block.text
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n")
        .trim();
    case "code":
      return `\`\`\`${block.language}\n${block.text}\n\`\`\``;
    case "table":
      if (block.rows.length === 0) {
        return "";
      }
      const header = `| ${block.rows[0].join(" | ")} |`;
      const divider = `| ${block.rows[0].map(() => "---").join(" | ")} |`;
      const body = block.rows.slice(1).map((row) => `| ${row.join(" | ")} |`).join("\n");
      return [header, divider, body].filter(Boolean).join("\n");
    case "hr":
      return "---";
    case "raw":
      return block.text.trimEnd();
    default:
      return "";
  }
}

function blockId(index: number) {
  return `block-${index + 1}`;
}

function looksLikeTable(lines: string[], index: number) {
  return Boolean(lines[index]?.includes("|") && lines[index + 1]?.includes("|") && isAlignmentRow(parseTableRow(lines[index + 1])));
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isAlignmentRow(row: string[]) {
  return row.length > 0 && row.every((cell) => /^:?-{3,}:?$/.test(cell));
}
