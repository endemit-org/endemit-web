/**
 * One-time registration of the business premise with FURS.
 * Movable premise (type C — e.g. event venue stand) by default.
 *
 * Usage: pnpm tsx scripts/register-fiscal-premise.ts [premiseType]
 * Env: FURS_* variables must be set (see src/lib/services/env/private).
 */
import "dotenv/config";

async function main() {
  const { registerBusinessPremise } = await import(
    "../src/lib/services/furs/client"
  );

  const taxNumber = Number(process.env.FURS_TAX_NUMBER);
  const premiseId = process.env.FURS_PREMISE_ID;
  if (!taxNumber || !premiseId) {
    throw new Error("FURS_TAX_NUMBER and FURS_PREMISE_ID must be set");
  }

  const premiseType = process.argv[2] ?? "C"; // A: movable object, B: at customer, C: other movable

  await registerBusinessPremise({
    TaxNumber: taxNumber,
    BusinessPremiseID: premiseId,
    BPIdentifier: {
      PremiseType: premiseType,
    },
    ValidityDate: new Date().toISOString().slice(0, 10),
    SoftwareSupplier: [{ TaxNumber: taxNumber }],
  });

  console.log(
    `Business premise "${premiseId}" registered with FURS (${process.env.FURS_ENV ?? "test"}).`
  );
}

main().catch(error => {
  console.error("Premise registration failed:", error);
  process.exit(1);
});
