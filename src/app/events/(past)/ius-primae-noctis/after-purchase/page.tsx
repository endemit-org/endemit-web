import Link from "next/link";
import Image from "next/image";

export default function AfterPurchase() {
  return (
    <div className="lg:pl-72 min-h-screen" style={{ background: "#FFFBEE" }}>
      <div className="lg:max-w-100 mx-auto space-y-8 sm:max-w-full">
        <div className="m-auto  max-w-5xl space-y-6 p-5 lg:px-12 text-black">
          <div className="m-auto  max-w-5xl  p-5 lg:px-12  text-black text-xl">
            <h2 className="text-center text-3xl font-bold">
              Haha, yes! Purchase confirmed.
            </h2>
            <Image
              src="/images/rener-thumbs-up.jpg"
              alt="Tickets"
              width={400}
              height={400}
              className="m-auto w-1/2"
            />
            <p>
              You should have received a ticket to the email address you
              specified. If you can&apos;t see it, check your spam folder, or
              contact us at endemit@endemit.org.
            </p>

            <p className="pt-4">
              ‼️ There is a known issue where we&apos;re having trouble sending
              tickets to hotmail email accounts. While we&apos;re working on a
              fix, please email us if you haven&apos;t received your ticket.
            </p>

            <p className="pt-4">See you at the event! </p>
          </div>
          <div className="flex justify-center space-x-4">
            <Link
              href={`/src/app/events/ius-primae-noctis/artists`}
              className="rounded-md bg-black px-6 py-2 text-center text-sm font-medium text-neutral-200 hover:bg-gray-800"
            >
              View Artists
            </Link>
            <Link
              href={`/src/app/events/ius-primae-noctis/location`}
              className="rounded-md bg-black px-6 py-2 text-center text-sm font-medium text-neutral-200 hover:bg-gray-800"
            >
              View Location
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
