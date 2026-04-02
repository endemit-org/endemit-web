import "server-only";

import forge from "node-forge";
import {
  APPLE_PASS_CERTIFICATE,
  APPLE_PASS_CERTIFICATE_PASSWORD,
  APPLE_WWDR_CERTIFICATE,
} from "@/lib/services/env/private";

// Apple WWDR G4 certificate (public, expires 2030)
// Download from: https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer
// Convert to base64: base64 -i AppleWWDRCAG4.cer

interface CertificateData {
  signerCert: Buffer;
  signerKey: Buffer;
  wwdr: Buffer;
}

let cachedCertificates: CertificateData | null = null;

/**
 * Extracts the signing certificate and private key from a PKCS#12 (.p12) file
 * and returns them along with the WWDR certificate in the format expected by passkit-generator
 */
export function getCertificates(): CertificateData {
  if (cachedCertificates) {
    return cachedCertificates;
  }

  if (!APPLE_PASS_CERTIFICATE) {
    throw new Error(
      "Missing APPLE_PASS_CERTIFICATE environment variable. " +
        "Export your pass signing certificate as .p12 and convert to base64."
    );
  }

  if (!APPLE_PASS_CERTIFICATE_PASSWORD) {
    throw new Error(
      "Missing APPLE_PASS_CERTIFICATE_PASSWORD environment variable."
    );
  }

  if (!APPLE_WWDR_CERTIFICATE) {
    throw new Error(
      "Missing APPLE_WWDR_CERTIFICATE environment variable. " +
        "Download from https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer " +
        "and convert to base64: base64 -i AppleWWDRCAG4.cer"
    );
  }

  // Decode the base64-encoded .p12 file
  const p12Buffer = Buffer.from(APPLE_PASS_CERTIFICATE, "base64");
  const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString("binary"));
  const p12 = forge.pkcs12.pkcs12FromAsn1(
    p12Asn1,
    APPLE_PASS_CERTIFICATE_PASSWORD
  );

  // Extract certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag];

  if (!certBag || certBag.length === 0) {
    throw new Error("No certificate found in .p12 file");
  }

  // Find the signing certificate (not the CA certificates)
  const signingCertBag = certBag.find(bag => {
    if (!bag.cert) return false;
    // The signing certificate has the passTypeIdentifier in its subject or extensions
    return bag.cert.subject.attributes.some(
      attr => attr.shortName === "UID" || attr.shortName === "CN"
    );
  });

  if (!signingCertBag?.cert) {
    throw new Error("No signing certificate found in .p12 file");
  }

  // Extract private key
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

  if (!keyBag || keyBag.length === 0) {
    throw new Error("No private key found in .p12 file");
  }

  const privateKey = keyBag[0].key;
  if (!privateKey) {
    throw new Error("Could not extract private key from .p12 file");
  }

  // Convert to PEM format
  const certPem = forge.pki.certificateToPem(signingCertBag.cert);
  const keyPem = forge.pki.privateKeyToPem(privateKey);

  // Decode WWDR certificate from base64
  // The WWDR certificate from Apple is in DER format, convert to PEM
  const wwdrDer = Buffer.from(APPLE_WWDR_CERTIFICATE, "base64");
  const wwdrAsn1 = forge.asn1.fromDer(wwdrDer.toString("binary"));
  const wwdrCert = forge.pki.certificateFromAsn1(wwdrAsn1);
  const wwdrPem = forge.pki.certificateToPem(wwdrCert);

  cachedCertificates = {
    signerCert: Buffer.from(certPem),
    signerKey: Buffer.from(keyPem),
    wwdr: Buffer.from(wwdrPem),
  };

  return cachedCertificates;
}
