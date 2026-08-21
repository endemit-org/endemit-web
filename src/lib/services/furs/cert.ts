import "server-only";

import forge from "node-forge";
import {
  FURS_CERT_P12_BASE64,
  FURS_CERT_PASSPHRASE,
} from "@/lib/services/env/private";

export interface FursCertificate {
  privateKeyPem: string; // PKCS#8
  certificatePem: string;
  p12Buffer: Buffer; // for mutual TLS (https pfx option)
  passphrase: string;
  subjectName: string;
  issuerName: string;
  serial: string; // decimal string
}

let cached: FursCertificate | null = null;

export function isFursConfigured(): boolean {
  return Boolean(FURS_CERT_P12_BASE64 && FURS_CERT_PASSPHRASE);
}

function formatDn(attributes: forge.pki.CertificateField[]): string {
  // FURS JWS header wants the DN as "name=value,name=value"
  return attributes
    .map(attr => `${attr.shortName ?? attr.name}=${attr.value}`)
    .join(",");
}

/**
 * Parse the FURS-issued "namensko digitalno potrdilo" from env.
 * Throws with a clear message when fiscalization is used unconfigured.
 */
export function getFursCertificate(): FursCertificate {
  if (cached) return cached;

  if (!FURS_CERT_P12_BASE64 || !FURS_CERT_PASSPHRASE) {
    throw new Error(
      "FURS certificate is not configured (FURS_CERT_P12_BASE64 / FURS_CERT_PASSPHRASE)"
    );
  }

  const p12Buffer = Buffer.from(FURS_CERT_P12_BASE64, "base64");
  const p12Asn1 = forge.asn1.fromDer(
    forge.util.createBuffer(p12Buffer.toString("binary"))
  );
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, FURS_CERT_PASSPHRASE);

  const keyBags =
    p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
      forge.pki.oids.pkcs8ShroudedKeyBag
    ] ?? [];
  const certBags =
    p12.getBags({ bagType: forge.pki.oids.certBag })[
      forge.pki.oids.certBag
    ] ?? [];

  const key = keyBags[0]?.key;
  const certificate = certBags[0]?.cert;
  if (!key || !certificate) {
    throw new Error("FURS certificate: could not extract key/cert from .p12");
  }

  const privateKeyInfo = forge.pki.wrapRsaPrivateKey(
    forge.pki.privateKeyToAsn1(key)
  );
  const privateKeyPem = forge.pki.privateKeyInfoToPem(privateKeyInfo);

  cached = {
    privateKeyPem,
    certificatePem: forge.pki.certificateToPem(certificate),
    p12Buffer,
    passphrase: FURS_CERT_PASSPHRASE,
    subjectName: formatDn(certificate.subject.attributes),
    issuerName: formatDn(certificate.issuer.attributes),
    serial: BigInt(`0x${certificate.serialNumber}`).toString(10),
  };
  return cached;
}
