/**
 * FURS connectivity check: parses the certificate from env and calls the
 * echo endpoint over mutual TLS.
 *
 * Usage: NODE_OPTIONS="--conditions=react-server" pnpm tsx scripts/furs-test-connection.ts
 */
import "dotenv/config";

async function main() {
  const { getFursCertificate } = await import("../src/lib/services/furs/cert");
  const { echo } = await import("../src/lib/services/furs/client");

  const cert = getFursCertificate();
  console.log("Certificate parsed:");
  console.log("  subject:", cert.subjectName);
  console.log("  issuer:", cert.issuerName);
  console.log("  serial:", cert.serial);

  const response = await echo("endemit-connectivity-test");
  console.log("Echo response:", response);
}

main().catch(error => {
  console.error("FURS connection test failed:", error);
  process.exit(1);
});
