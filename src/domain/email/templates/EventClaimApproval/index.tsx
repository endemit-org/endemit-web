import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text, Link } from "@react-email/components";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";

interface Props {
  eventName: string;
}

function EventClaimApprovalTemplate({ eventName }: Props) {
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">
          Event Added to Your Profile!
        </h1>
        <Text className="text-gray-600 mb-6">
          Great news! <strong>{eventName}</strong> has been added to your
          &quot;Events Attended&quot; list. Thanks for being part of our
          community!
        </Text>

        <div
          style={{
            marginTop: "32px",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          <Link
            href={`${PUBLIC_BASE_WEB_URL}/profile`}
            style={{
              display: "inline-block",
              backgroundColor: "#18181b",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            View Your Profile
          </Link>
        </div>

        <Text className="text-gray-600 my-6">
          Questions? Contact us at{" "}
          <Link href="mailto:endemit@endemit.org" className="link">
            endemit@endemit.org
          </Link>
        </Text>
      </div>
    </MasterTemplate>
  );
}

export { EventClaimApprovalTemplate };
