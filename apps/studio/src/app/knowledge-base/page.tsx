import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DocTree, DocViewer, getDocTree, readDoc } from "@/modules/docs";
import { DEFAULT_DOC_PATH, getSemanticEntryGroups } from "@/modules/portal";

export default async function KnowledgeBasePage({
  searchParams
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const params = await searchParams;
  const selectedPath = params.path?.trim() || DEFAULT_DOC_PATH;
  const [tree, doc, semanticGroups] = await Promise.all([getDocTree(), readDoc(selectedPath), getSemanticEntryGroups()]);

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card className="h-fit">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">语义入口</p>
          <h2 className="mt-2 text-xl font-semibold">按分组直接进入</h2>
          <div className="mt-5 space-y-5">
            {semanticGroups.map((group) => (
              <section key={group.title}>
                <p className="text-sm font-medium tracking-[0.12em] text-white">{group.title}</p>
                <div className="mt-3 grid gap-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.path}
                      href={`/knowledge-base?path=${encodeURIComponent(item.path)}`}
                      className="block rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 transition hover:border-accent/30 hover:bg-white/[0.05]"
                    >
                      <p className="text-sm font-medium text-white">{item.label}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Card>
        <Card className="h-fit">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">文档</p>
          <h2 className="mt-2 text-xl font-semibold">Live 文档门户</h2>
          <div className="mt-5">
            <DocTree nodes={tree} selectedPath={selectedPath} />
          </div>
        </Card>
      </div>
      <DocViewer absolutePath={doc.absolutePath} content={doc.content} meta={doc.meta} title={selectedPath} />
    </div>
  );
}
