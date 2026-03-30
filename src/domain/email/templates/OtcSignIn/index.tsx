import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text, Link } from "@react-email/components";

interface Props {
  code: string;
  magicLinkUrl: string;
  expiresInMinutes: number;
}

function OtcSignInTemplate({ code, magicLinkUrl, expiresInMinutes }: Props) {
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">Your Sign-in Code</h1>
        <Text className="text-gray-600 mb-6">
          Use the code below to sign in to your account. This code will expire
          in {expiresInMinutes} minutes.
        </Text>

        <div
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: "12px",
            padding: "32px",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          <Text
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              letterSpacing: "8px",
              fontFamily: "monospace",
              margin: 0,
              color: "#111827",
            }}
          >
            {code}
          </Text>
        </div>

        <div
          style={{
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <Text className="text-gray-500 mb-4">Or click the button below:</Text>
          <Link
            href={magicLinkUrl}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              padding: "12px 32px",
              borderRadius: "8px",
              fontWeight: "600",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Sign In Instantly
          </Link>
        </div>

        <div
          className="bg-neutral-100 border border-neutral-200"
          style={{
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <Text className="text-sm text-neutral-600 my-0">
            If you did not request this code, you can safely ignore this email.
            Someone may have entered your email address by mistake.
          </Text>
        </div>

        <Text className="text-gray-600 text-sm">
          Questions? Contact us at{" "}
          <Link href="mailto:endemit@endemit.org" className="link">
            endemit@endemit.org
          </Link>
        </Text>
      </div>
    </MasterTemplate>
  );
}

export { OtcSignInTemplate };
