import "server-only";

import {
  VERCEL_API_TOKEN,
  VERCEL_PROJECT_ID,
  VERCEL_TEAM_ID,
} from "@/lib/services/env/private";

export type VercelDeploymentState =
  | "QUEUED"
  | "INITIALIZING"
  | "BUILDING"
  | "READY"
  | "ERROR"
  | "CANCELED";

export interface VercelDeployment {
  uid: string;
  state: VercelDeploymentState;
  /** "production" or null (preview) */
  target: string | null;
  branch: string | null;
  commitMessage: string | null;
  commitSha: string | null;
  creator: string | null;
  createdAt: string;
  /** Build duration in ms, null while queued/building */
  durationMs: number | null;
  /** Deployment URL (https://...) */
  url: string | null;
  /** Vercel dashboard inspector URL */
  inspectorUrl: string | null;
}

type VercelApiDeployment = {
  uid: string;
  url?: string;
  created: number;
  buildingAt?: number;
  ready?: number;
  state?: string;
  readyState?: string;
  target?: string | null;
  inspectorUrl?: string | null;
  creator?: { username?: string; email?: string };
  meta?: Record<string, string | undefined>;
};

export const isVercelApiConfigured = () =>
  Boolean(VERCEL_API_TOKEN && VERCEL_PROJECT_ID);

export const getVercelDeployments = async (
  limit = 20
): Promise<VercelDeployment[]> => {
  if (!isVercelApiConfigured()) {
    throw new Error("Vercel API is not configured");
  }

  const params = new URLSearchParams({
    projectId: VERCEL_PROJECT_ID!,
    limit: String(limit),
  });
  if (VERCEL_TEAM_ID) params.set("teamId", VERCEL_TEAM_ID);

  const response = await fetch(
    `https://api.vercel.com/v6/deployments?${params}`,
    {
      headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Vercel API request failed: ${response.status} ${await response.text()}`
    );
  }

  const body = (await response.json()) as {
    deployments: VercelApiDeployment[];
  };

  return body.deployments.map(d => ({
    uid: d.uid,
    state: (d.readyState ?? d.state ?? "QUEUED") as VercelDeploymentState,
    target: d.target ?? null,
    branch: d.meta?.githubCommitRef ?? null,
    commitMessage: d.meta?.githubCommitMessage ?? null,
    commitSha: d.meta?.githubCommitSha ?? null,
    creator: d.creator?.username ?? d.creator?.email ?? null,
    createdAt: new Date(d.created).toISOString(),
    durationMs:
      d.ready && d.buildingAt && d.ready > d.buildingAt
        ? d.ready - d.buildingAt
        : null,
    url: d.url ? `https://${d.url}` : null,
    inspectorUrl: d.inspectorUrl ?? null,
  }));
};
