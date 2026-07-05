import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFoundContent() {
  const t = await getTranslations("notFound");
  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <div
        className="absolute  h-full opacity-20 inset w-full"
        style={{
          background: "url('/images/noise.gif') no-repeat center center",
          backgroundSize: "200px",
          backgroundRepeat: "repeat",
        }}
      ></div>
      <div className="relative">
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-bold text-red-500">404</h1>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-neutral-400 max-w-md">{t("description")}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-red-500 hover:bg-red-600 transition-colors font-bold"
          >
            {t("backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
