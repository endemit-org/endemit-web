import Subscribe from "@/app/_components/newsletter/Subscribe";
import { getApiPath } from "@/lib/util/api";
import { getTranslations } from "next-intl/server";

export default async function EndemitSubscribe({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const t = await getTranslations("newsletter");

  return (
    <Subscribe
      title={title ?? t("defaultTitle")}
      description={description ?? t("endemit.defaultDescription")}
      apiEndpoint={getApiPath("newsletter/general-subscribe")}
      containerClass="mt-16 mb-16"
    />
  );
}
