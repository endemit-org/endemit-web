"use client";

import ParallaxHero from "@/app/events/(past)/issun-boshi-vinyl-release/(components)/ParallaxHero";
import Image from "next/image";
import { Parallax } from "react-scroll-parallax";
import ParallaxFooter from "@/app/events/(past)/issun-boshi-vinyl-release/(components)/ParallaxFooter";
import ParallaxAlbum from "@/app/events/(past)/issun-boshi-vinyl-release/(components)/ParallaxAlbum";
import Link from "next/link";

export default function IssunBoshiVinylReleasePage() {
  return (
    <div className="lg:max-w-100 mx-auto  sm:max-w-full overflow-hidden font-typo">
      <ParallaxHero />

      <div className="relative w-full z-10 min-h-screen">
        <div className="w-full h-2 bg-[#f5cf98]" />

        <div className="flex flex-col gap-y-28 p-28 px-6 lg:px-28">
          <div>
            <div className="text-4xl text-center text-issun-boshi-yellow">
              20 Sep 2025
            </div>
            <div className="mt-4 flex items-center justify-center space-x-2 text-lg">
              <Image
                src="/images/kader.png"
                alt="Kader"
                width={16}
                height={16}
                className="w-4"
              />
              <span>Kader - Grad Kodeljevo</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center space-x-2 text-sm">
            <div className="relative">
              <ParallaxAlbum />
            </div>
          </div>

          <div className="text-center  left-0 w-full flex flex-col items-center top-[8%] md:top-[12%] ">
            <div className="text-center text-4xl md:text-4xl lg:text-5xl uppercase text-white lg:w-3/4 md:w-4/5 mx-4 pb-16">
              After a decade of both creative blockade and artistic growth,
              MMali is set to present his first vinyl release.
            </div>
            <div className="text-center text-xl md:text-2xl lg:text-3xl font-light text-white mt-4 lg:w-2/3 md:w-4/5 mx-4">
              Named after his alter ego Issun-Boshi, a one-inch samurai who
              overcomes all obstacles to win the heart of a princess, owning his
              shortcomings and outgrowing them.
              <br />
              <br />
              Accompanied on this journey by his brother-by-heart and master Ed
              Davenport, also known as Inland, MMali is about to open a new
              chapter in life{" "}
              <Link
                className={"text-issun-boshi-yellow font-normal link"}
                href={
                  "/src/app/events/(past)/issun-boshi-vinyl-release/location"
                }
              >
                on 20 September in Kader
              </Link>
              , adding production skills to his mixing achievements.
              <br />
              <br />
              For the first time, his warm-up set will feature his own
              production, available exclusively for{" "}
              <Link
                className={"text-issun-boshi-yellow font-normal link"}
                href={
                  "/src/app/events/(past)/issun-boshi-vinyl-release/get-the-ep"
                }
              >
                purchase at the event
              </Link>
              . And who else would be better to close this special Endemit
              edition than Inland himself, the brother who mastered the sound of
              the first Endemit EP release.
            </div>
          </div>

          <Parallax
            shouldAlwaysCompleteAnimation={true}
            scale={[1.2, 1, "easeInOutCubic"]}
          >
            <div className="flex flex-col gap-4 items-center justify-center">
              {/*<Button href="/events/issun-boshi-vinyl-release/tickets">*/}
              {/*<TicketIcon />*/}
              {/*  Get tickets*/}
              {/*</Button>*/}

              <div>
                {["19h • Warm up w/ Rahul", "22h • MMali", "02h • Inland"].map(
                  artist => (
                    <div
                      key={artist}
                      className="text-issun-boshi-orange text-md"
                    >
                      {artist}
                    </div>
                  )
                )}
              </div>
            </div>
          </Parallax>
        </div>
        <ParallaxFooter />
      </div>
    </div>
  );
}
