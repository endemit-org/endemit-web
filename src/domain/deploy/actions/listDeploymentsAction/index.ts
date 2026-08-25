"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  getVercelDeployments,
  isVercelApiConfigured,
  type VercelDeployment,
} from "@/domain/deploy/operations/getVercelDeployments";
import { VERCEL_GIT_COMMIT_REF } from "@/lib/services/env/private";

export interface ListDeploymentsResult {
  configured: boolean;
  deployments: VercelDeployment[];
  /**
   * Branch the running environment was built from — the list is filtered to
   * it, so staging only shows staging builds and production only main.
   * Null in local dev (unfiltered list).
   */
  branch: string | null;
  error?: string;
}

export async function listDeploymentsAction(): Promise<ListDeploymentsResult> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.DEPLOY_TRIGGER),
    "User not authorized to view deployments"
  );

  const branch = VERCEL_GIT_COMMIT_REF ?? null;

  if (!isVercelApiConfigured()) {
    return { configured: false, deployments: [], branch };
  }

  try {
    // Fetch a larger window before filtering so busy sibling branches can't
    // crowd this environment's builds out of the page.
    const all = await getVercelDeployments(50);
    const deployments = branch
      ? all.filter(d => d.branch === branch).slice(0, 20)
      : all.slice(0, 20);
    return { configured: true, deployments, branch };
  } catch (error) {
    console.error("Failed to list Vercel deployments:", error);
    return {
      configured: true,
      deployments: [],
      branch,
      error: "Failed to load deployments from Vercel",
    };
  }
}
