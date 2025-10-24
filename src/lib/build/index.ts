interface BuildInfo {
  commitSha?: string;
  deploymentId?: string;
  deploymentUrl?: string;
  version?: string;
}

interface FormattedBuildInfo {
  full: string;
  short: string;
  commitSha: string | null;
  commitShaShort: string | null;
  deploymentId: string | null;
  deploymentIdShort: string | null;
  version: string | null;
  isLocal: boolean;
}

export const getBuildInfo = (info: BuildInfo): FormattedBuildInfo => {
  const commitSha = info.commitSha || null;
  const commitShaShort = commitSha ? commitSha.slice(0, 7) : null;

  const deploymentId = info.deploymentId || null;
  const deploymentIdShort = deploymentId ? deploymentId.slice(4, 12) : null;

  const version = info.version || null;

  const isLocal = !commitSha && !deploymentId;

  const parts: string[] = [];

  if (version) parts.push(`v${version}`);

  if (isLocal) {
    parts.push("local-dev");
  } else {
    if (commitShaShort) parts.push(`(${commitShaShort})`);
    if (deploymentIdShort) parts.push(deploymentIdShort);
  }

  const full = parts.join(" ");

  const shortParts: string[] = [];
  if (version) shortParts.push(`v${version}`);

  if (isLocal) {
    shortParts.push("dev");
  } else {
    if (commitShaShort) shortParts.push(`(${commitShaShort})`);
  }

  const short = shortParts.join(" ") || "dev";

  return {
    full,
    short,
    commitSha,
    commitShaShort,
    deploymentId,
    deploymentIdShort,
    version,
    isLocal,
  };
};
