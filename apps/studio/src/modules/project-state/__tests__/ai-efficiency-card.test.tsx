import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildAiEfficiencyDashboard } from "../../../../../../shared/ai-efficiency";
import { AiEfficiencyCard } from "../components/ai-efficiency-card";

describe("ai efficiency card", () => {
  it("surfaces the shared default summary-first workflow", () => {
    render(<AiEfficiencyCard dashboard={buildAiEfficiencyDashboard([])} />);

    expect(screen.getByText("默认摘要链")).toBeInTheDocument();
    expect(screen.getByText(/原始回退链/)).toBeInTheDocument();
    expect(screen.getByText("pnpm ai:preflight:summary")).toBeInTheDocument();
    expect(screen.getByText(/pnpm preflight/)).toBeInTheDocument();
  });
});
