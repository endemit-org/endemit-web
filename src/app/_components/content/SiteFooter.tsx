import Link from "next/link";
import EndemitSymbol from "@/app/_components/icon/EndemitSymbol";
import packageJson from "@/package.json";
import { fetchFooterFromCms } from "@/domain/cms/operations/fetchFooterFromCms";
import { getBuildInfo } from "@/lib/build";

export default async function SiteFooter() {
  const footerContent = await fetchFooterFromCms();

  if (!footerContent) {
    return;
  }

  const Divider = () => (
    <span className={"mx-1"}> {footerContent.linkDividerSymbol ?? `·`} </span>
  );

  const replacedTextValueWithVars = footerContent
    ? footerContent.text
        .replace("{YEAR}", new Date().getFullYear().toString())
        .replace("{VERSION}", `v${packageJson.version}`)
    : "© Endemit";

  const buildInfo = getBuildInfo({
    commitSha: process.env.NEXT_PUBLIC_COMMIT_SHA,
    deploymentId: process.env.NEXT_PUBLIC_DEPLOYMENT_ID,
    version: packageJson.version,
  });

  return (
    <footer
      className={
        "text-neutral-500 absolute -bottom-28 lg:-bottom-16 text-center w-full text-xs left-0 max-lg:px-5"
      }
    >
      <div
        className="text-neutral-200 w-4 inline-block mb-2"
        title={buildInfo.full}
      >
        <EndemitSymbol />
      </div>
      <div>
        {replacedTextValueWithVars}
        <span className="max-lg:hidden">
          <Divider />
        </span>
        <div className={"lg:inline-block max-lg:mt-2"}>
          {footerContent?.links.map((link, index) => (
            <span key={`footer-${link.link}`}>
              {index > 0 && <Divider />}
              <Link href={link.link}>{link.label}</Link>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
