import Subscribe from "@/components/newsletter/Subscribe";
import { getApiPath } from "../../../lib/api";

export default function FestivalSubscribe({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Subscribe
      title={title ?? "SUBSCRIBE"}
      description={
        description ??
        "Endemit Festival is private community gathering, accessible only by invitation. If you'd like to become a member, sign up and we'll send you more info."
      }
      apiEndpoint={getApiPath("newsletter/festival-subscribe")}
    />
  );
}
