import { headers } from "next/headers";
import Link from "next/link";
import { PageOutline } from "@/components/page-outline";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DocTree, DocViewer, extractHeadings, getDocTree, readDoc } from "@/modules/docs";
import { DEFAULT_DOC_PATH, getSemanticEntryGroups } from "@/modules/portal";
import { getManagementAccessState } from "@/modules/releases";

export default async function KnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const params = await searchParams;
  const selectedPath = params.path?.trim() || null;
  const access = getManagementAccessState(await headers());
  const [tree, semanticGroups] = await Promise.all([getDocTree(), getSemanticEntryGroups()]);

  if (!selectedPath) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <PageHeader
            eyebrow="证据入口"
            title="这页先回答一件事：你现在需要哪类证据"
            description="首页已经给了经营判断；进入证据库之后，先选主源、待思考证据、待规划证据、执行规则或发布事实，再下钻具体文档。"
            note="这里是“先选入口，再看正文”的工作台，不是把所有文档平铺一遍。"
            metrics={[
              { label: "高频主干", value: `${semanticGroups[0]?.items.length ?? 0} 项`, tone: "accent" },
              { label: "场景下钻", value: `${semanticGroups[1]?.items.length ?? 0} 项` },
              { label: "专项附录", value: `${semanticGroups[2]?.items.length ?? 0} 项`, tone: "success" },
              { label: "执行与发布", value: `${semanticGroups[3]?.items.length ?? 0} 项`, tone: "warning" },
            ]}
          />
          <div className="grid gap-4 xl:grid-cols-2">
            {semanticGroups.map((group) => (
              <Card key={group.title} className="h-full">
                <p className="text-xs uppercase tracking-[0.22em] text-sky-700">{group.title}</p>
                {group.description ? <p className="mt-3 text-sm leading-7 text-slate-600">{group.description}</p> : null}
                <div className="mt-5 grid gap-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.path || item.href || item.label}
                      href={item.href || `/knowledge-base?path=${encodeURIComponent(item.path || DEFAULT_DOC_PATH)}`}
                      className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-sky-200 hover:bg-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      {item.description ? <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p> : null}
                    </Link>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
        <Card className="h-fit xl:sticky xl:top-6">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-700">完整目录</p>
          <details className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-900">展开完整文档目录</summary>
            <p className="mt-2 text-xs leading-5 text-slate-500">当精选证据入口不够时，再下钻完整树。</p>
            <div className="mt-4">
              <DocTree nodes={tree} selectedPath={DEFAULT_DOC_PATH} />
            </div>
          </details>
        </Card>
      </div>
    );
  }

  const [doc, promptDocs] = await Promise.all([
    readDoc(selectedPath),
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
    <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_240px]">
      <div className="space-y-6">
        <Card className="h-fit">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-700">证据入口</p>
          <p className="mt-4 text-sm leading-7 text-slate-600">这里是下钻导航，不是首页。先选入口，再看正文。</p>
          <div className="mt-5 space-y-5">
            {semanticGroups.map((group) => (
              <section key={group.title}>
                <p className="text-sm font-medium tracking-[0.12em] text-slate-900">{group.title}</p>
                {group.description ? <p className="mt-1 text-xs leading-5 text-slate-500">{group.description}</p> : null}
                <div className="mt-3 grid gap-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.path || item.href || item.label}
                      href={item.href || `/knowledge-base?path=${encodeURIComponent(item.path || DEFAULT_DOC_PATH)}`}
                      className="block rounded-2xl border border-slate-200 bg-white px-3 py-3 transition hover:border-sky-200 hover:bg-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      {item.description ? <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p> : null}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Card>
        <Card className="h-fit">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-700">完整目录</p>
          <details className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-900">展开完整文档目录</summary>
            <p className="mt-2 text-xs leading-5 text-slate-500">当精选证据入口不够时，再下钻完整树。</p>
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
      <PageOutline items={outline} className="hidden xl:block" />
    </div>
  );
}
