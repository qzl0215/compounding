import { ProposalWorkspace } from "@/components/proposals/proposal-workspace";
import { Card } from "@/components/ui/card";
import { listProposalBundles } from "@/lib/proposals";

export default async function ReviewsPage() {
  const proposals = await listProposalBundles();

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Reviews</p>
        <h2 className="mt-2 text-3xl font-semibold">摘要审批优先，完整 diff 折叠在 Advanced</h2>
        <p className="mt-3 max-w-3xl text-sm text-white/68">
          系统会先把 proposal 压缩成一页 review summary。只有在你需要时，才展开 block-level 细节。
        </p>
      </Card>
      <ProposalWorkspace initialProposals={proposals} />
    </div>
  );
}
