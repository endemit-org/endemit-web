import "server-only";

import { PKPass } from "passkit-generator";
import path from "path";
import { getCertificates } from "../../utils/certificates";

export interface ApplePassWalletData {
  userId: string;
  userName: string;
  receiveCode: string;
}

export async function generateWalletApplePass(
  data: ApplePassWalletData
): Promise<Buffer> {
  const certificates = getCertificates();

  const passModelPath = path.join(
    process.cwd(),
    "src",
    "domain",
    "wallet-pass",
    "walletmodel.pass"
  );

  let pass: PKPass;
  try {
    pass = await PKPass.from(
      {
        model: passModelPath,
        certificates: {
          wwdr: certificates.wwdr,
          signerCert: certificates.signerCert,
          signerKey: certificates.signerKey,
        },
      },
      {
        // Stable per user so re-adding replaces the existing pass
        serialNumber: `endemit-wallet-${data.userId}`,
        description: "Endemit Wallet",
      }
    );
  } catch (error) {
    console.error("PKPass.from error:", error);
    throw new Error(
      `Failed to create PKPass: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  if (!pass) {
    throw new Error("Failed to create PKPass - pass model may be invalid");
  }

  // The barcode carries the signed receive code — the same payload as the
  // on-screen wallet QR, resolved at the register via resolveScanTarget.
  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: data.receiveCode,
    messageEncoding: "utf-8",
  });

  pass.secondaryFields.push({
    key: "holder",
    label: "NAME",
    value: data.userName,
  });

  pass.backFields.push({
    key: "howToUse",
    label: "How to use",
    value:
      "Show this pass at the register to pay from your Endemit wallet. " +
      "Your balance is visible on your profile page.",
  });

  pass.backFields.push({
    key: "support",
    label: "Support",
    value: "endemit@endemit.org",
  });

  return pass.getAsBuffer();
}
