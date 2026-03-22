import { headers } from "next/headers";
import Link from "next/link";
import { PageOutline } from "@/components/page-outline";
import { Card } from "@/components/ui/card";
import { DocTree, DocViewer, extractHeadings, getDocTree, readDoc } from "@/modules/docs";
import { DEFAULT_DOC_PATH, getSemanticEntryGroups } from "@/modules/portal";
import { getManagementAccessState } from "@/modules/releases";

export default async function KnowledgeBasePage({
  searchParams
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const params = await searchParams;
  const selectedPath = params.path?.trim() || DEFAULT_DOC_PATH;
  const access = getManagementAccessState(await headers());
  const [tree, doc, semanticGroups, promptDocs] = await Promise.all([
    getDocTree(),
    readDoc(selectedPath),
    getSemanticEntryGroups(),
    Promise.all([
      readDoc("docs/prompts/ai-doc-rewrite-system.md"),
      readDoc("docs/prompts/ai-doc-clarify-user.md"),
      readDoc("docs/prompts/ai-doc-rewrite-user.md"),
    ]),
  ]);
  const outline = extractHeadings(doc.content)
    .filter((heading) => heading.depth <= 3)
    .map((heading) => ({ id: heading.id, label: heading.label }));

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_260px]">
      <div className="space-y-6">
        <Card className="h-fit">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">证据入口</p>
          <div className="mt-5 space-y-5">
            {semanticGroups.map((group) => (
              <section key={group.title}>
                <p className="text-sm font-medium tracking-[0.12em] text-white">{group.title}</p>
                {group.description ? <p className="mt-1 text-xs leading-5 text-white/48">{group.description}</p> : null}
                <div className="mt-3 grid gap-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.path || item.href || item.label}
                      href={item.href || `/knowledge-base?path=${encodeURIComponent(item.path || DEFAULT_DOC_PATH)}`}
                      className="block rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 transition hover:border-accent/30 hover:bg-white/[0.05]"
                    >
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      {item.description ? <p className="mt-1 text-xs leading-5 text-white/48">{item.description}</p> : null}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Card>
        <Card className="h-fit">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">完整目录</p>
          <details className="mt-5 rounded-3xl border border-white/8 bg-white/[0.03] p-4">
            <summary className="cursor-pointer text-sm font-medium text-white">展开完整文档目录</summary>
            <p className="mt-2 text-xs leading-5 text-white/48">当精选证据入口不够时，再下钻完整树和 archive。</p>
            <div className="mt-4">
              <DocTree nodes={tree} selectedPath={selectedPath} />
            </div>
          </details>
        </Card>
      </div>
      <DocViewer
        content={doc.content}
        rawContent={doc.rawContent}
        meta={doc.meta}
        title={selectedPath}
        path={doc.relativePath}
        kind={doc.kind}
        editable={doc.editable && access.allowed}
        hasManagedBlocks={doc.hasManagedBlocks}
        promptDocs={promptDocs.map((item) => ({
          path: item.relativePath,
          title: item.meta.title ?? item.relativePath,
          content: item.content,
        }))}
      />
      <PageOutline items={outline} />
    </div>
  );
}
