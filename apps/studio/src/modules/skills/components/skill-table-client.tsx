"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { SkillTable } from "./skill-table";
import type { SkillStatus, SkillTableRow } from "../types";

export function SkillTableClient({ initialSkills }: { initialSkills: SkillTableRow[] }) {
  const router = useRouter();

  const handleStatusChange = useCallback(async (id: string, newStatus: SkillStatus) => {
    try {
      const response = await fetch("/api/skills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update skill status:", error);
    }
  }, [router]);

  return <SkillTable skills={initialSkills} onStatusChange={handleStatusChange} />;
}
