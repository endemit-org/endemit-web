import Subscribe from "@/components/newsletter/Subscribe";
import { getApiPath } from "@/lib/api";

export default function EndemitSubscribe({
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
        "Receive updates about our upcoming events, music, and announcements"
      }
      apiEndpoint={getApiPath("newsletter/general-subscribe")}
      containerClass="mt-16 mb-16"
    />
  );
}
