import {
  SliceSimulator,
  SliceSimulatorParams,
  getSlices,
} from "@slicemachine/adapter-next/simulator";
import SliceDisplay from "@/app/_components/content/SliceDisplay";

export default async function SliceSimulatorPage({
  searchParams,
}: SliceSimulatorParams) {
  const { state } = await searchParams;
  const slices = getSlices(state);

  return (
    <div className="bg-neutral-800">
      <SliceSimulator>
        <SliceDisplay slices={slices} />
      </SliceSimulator>
    </div>
  );
}
