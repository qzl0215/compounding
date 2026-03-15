import { Card } from "@/components/ui/card";
import { DocTree, DocViewer, getDocTree, readDoc } from "@/modules/docs";
import { DEFAULT_DOC_PATH } from "@/modules/portal";

export default async function KnowledgeBasePage({
  searchParams
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const params = await searchParams;
  const selectedPath = params.path?.trim() || DEFAULT_DOC_PATH;
  const [tree, doc] = await Promise.all([getDocTree(), readDoc(selectedPath)]);

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">文档</p>
        <h2 className="mt-2 text-xl font-semibold">Live 文档门户</h2>
        <p className="mt-3 text-sm text-white/62">
          默认先读 <code>AGENTS.md</code>。当前树按 docs / memory / code_index / tasks 分层，archive 默认折叠。
        </p>
        <div className="mt-5">
          <DocTree nodes={tree} selectedPath={selectedPath} />
        </div>
      </Card>
      <DocViewer absolutePath={doc.absolutePath} content={doc.content} meta={doc.meta} title={selectedPath} />
    </div>
  );
}
