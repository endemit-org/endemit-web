import Subscribe from "@/app/_components/newsletter/Subscribe";
import { getApiPath } from "@/lib/util/api";
import { getTranslations } from "next-intl/server";

export default async function FestivalSubscribe({
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
      description={description ?? t("festival.defaultDescription")}
      apiEndpoint={getApiPath("newsletter/festival-subscribe")}
    />
  );
}
