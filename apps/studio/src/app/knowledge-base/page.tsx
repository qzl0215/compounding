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
          <p className="text-xs uppercase tracking-[0.28em] text-accent">语义入口</p>
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
          <div className="mt-5">
            <DocTree nodes={tree} selectedPath={selectedPath} />
          </div>
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
