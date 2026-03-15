import { headers } from "next/headers";
import { PageOutline } from "@/components/page-outline";
import { Card } from "@/components/ui/card";
import { getManagementAccessState, getReleaseDashboard } from "@/modules/releases";
import { ReleaseDashboardPanel } from "@/modules/releases/components/release-dashboard-panel";

export const dynamic = "force-dynamic";

export default async function ReleasesPage() {
  const access = getManagementAccessState(await headers());

  if (!access.allowed) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-danger">发布管理</p>
          <h2 className="mt-3 text-3xl font-semibold">当前入口仅允许本机或内网访问。</h2>
          <p className="mt-4 max-w-3xl text-white/68">{access.reason}</p>
        </Card>
        <PageOutline items={[]} emptyText="当前页面没有可导航区块。" />
      </div>
    );
  }

  const dashboard = getReleaseDashboard();
  const outline = [
    { id: "release-overview", label: "发布模型" },
    { id: "release-history", label: "版本台账" },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="space-y-6">
        <section id="release-overview">
          <Card>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">发布管理</p>
            <h2 className="mt-3 text-3xl font-semibold">main 直发生产与可回滚版本台账</h2>
            <p className="mt-4 max-w-4xl text-white/68">
              新版本会先在后台 release 目录完成依赖安装、构建和最小 smoke check，成功后才会切换 `current`
              软链；如果切坏，可以直接在这里回滚到任一健康版本。
            </p>
            <dl className="mt-6 grid gap-4 md:grid-cols-3">
              <Meta title="运行根目录" value={dashboard.runtime_root} />
              <Meta title="当前激活版本" value={dashboard.active_release_id || "尚未切换任何 release"} />
              <Meta title="历史版本数" value={String(dashboard.releases.length)} />
            </dl>
          </Card>
        </section>
        <section id="release-history">
          <ReleaseDashboardPanel activeReleaseId={dashboard.active_release_id} releases={dashboard.releases} />
        </section>
      </div>
      <PageOutline items={outline} />
    </div>
  );
}

function Meta({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/42">{title}</p>
      <p className="mt-3 break-all text-sm text-white/78">{value}</p>
    </div>
  );
}
