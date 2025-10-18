import Breadcrumb from "@/components/content/Breadcrumb";

interface Props {
  title: string;
  segments: { label: string; path: string }[];
}

export default function PageHeadline({ title, segments }: Props) {
  return (
    <div className="flex ">
      <div>
        <h1 className="text-3xl font-bold text-white mb-0 pb-0">{title}</h1>
        <Breadcrumb segments={segments} />
      </div>
    </div>
  );
}
