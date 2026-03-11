import Link from "next/link";
import { Card } from "@/components/ui/card";
import { readDoc } from "@/lib/docs";

const coreDocs = [
  "PROJECT_CARD.md",
  "OPERATING_RULES.md",
  "ORG_MODEL.md",
  "PLAYBOOK.md",
  "MEMORY_LEDGER.md"
];

export default async function KnowledgeBasePage({
  searchParams
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const params = await searchParams;
  const selectedPath = coreDocs.includes(params.path ?? "") ? params.path ?? coreDocs[0] : coreDocs[0];
  const doc = await readDoc(selectedPath);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.28fr_0.72fr]">
      <Card className="h-fit">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Advanced</p>
        <h2 className="mt-2 text-xl font-semibold">核心知识内核</h2>
        <p className="mt-3 text-sm text-white/62">默认模式不需要阅读这些文档。只有你想看系统底层规则时，再打开这里。</p>
        <div className="mt-5 space-y-3">
          {coreDocs.map((path) => {
            const active = selectedPath === path;
            return (
              <Link
                key={path}
                className={`block rounded-2xl border px-4 py-3 text-sm transition ${
                  active ? "border-accent/45 bg-accent/12 text-white" : "border-white/8 bg-white/[0.03] text-white/72 hover:border-white/14"
                }`}
                href={`/knowledge-base?path=${encodeURIComponent(path)}`}
              >
                {path}
              </Link>
            );
          })}
        </div>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-[0.28em] text-accent">{selectedPath}</p>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-white/78">{doc.content}</pre>
      </Card>
    </div>
  );
}
