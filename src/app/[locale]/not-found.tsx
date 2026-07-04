import NotFoundContent from "@/app/_components/ui/NotFoundContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 Page Not Found",
  description:
    "The page you are looking for no longer exists or was moved. Please return to endemit.org.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return <NotFoundContent />;
}
