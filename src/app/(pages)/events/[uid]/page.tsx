import PageHeadline from "@/app/_components/ui/PageHeadline";
import OuterPage from "@/app/_components/ui/OuterPage";
import { notFound } from "next/navigation";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { fetchEventFromCmsByUid } from "@/domain/cms/operations/fetchEventFromCms";
import Tabs, { TabItem } from "@/app/_components/content/Tabs";
import { fetchInnerContentPagesForEvent } from "@/domain/cms/operations/fetchInnerContentPagesFromCms";
import SliceDisplay from "@/app/_components/content/SliceDisplay";
import { formatEventDate, formatEventDateAndTime } from "@/lib/util/formatting";
import EventLineUp from "@/app/_components/event/EventLineUp";
import EventLocation from "@/app/_components/event/EventLocation";
import Link from "next/link";
import { Product } from "@/domain/product/types/product";
import ProductAddToCart from "@/app/_components/product/ProductAddToCart";
import { fetchProductFromCmsById } from "@/domain/cms/operations/fetchProductFromCms";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import clsx from "clsx";
import { Metadata } from "next";
import EventSeoMicrodata from "@/app/_components/seo/EventSeoMicrodata";
import { getResizedPrismicImage } from "@/lib/util/util";
import { isEventCompleted } from "@/domain/event/businessLogic";
import ArtistCarousel from "@/app/_components/artist/ArtistCarousel";
import { buildOpenGraphImages, buildOpenGraphObject } from "@/lib/util/seo";
import { isProductSellable } from "@/domain/product/businessLogic";

export async function generateStaticParams() {
  const events = await fetchEventsFromCms({});

  if (!events || events.length === 0) {
    return [];
  }

  return events.map(event => ({
    uid: event.uid,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    uid: string;
  }>;
}): Promise<Metadata> {
  const { uid } = await params;
  const event = await fetchEventFromCmsByUid(uid);

  if (!event) {
    notFound();
  }

  const title = `${event.meta.title ?? `${`${event.name} - ${event.date_start && event.date_end ? formatEventDate(event.date_start, event.date_end) : ""}`}`} • Events`;
  const description = event?.meta.description ?? event.description ?? undefined;
  const images = buildOpenGraphImages({
    metaImage: event.meta.image,
    fallbackImages: event.promoImage?.src ? [event.promoImage.src] : undefined,
  });

  return buildOpenGraphObject({ title, description, images });
}

function TicketDisplay({ product }: { product: Product }) {
  return (
    <div className={"flex flex-col items-center text-neutral-200"}>
      <div className={"font-heading uppercase text-3xl text-neutral-400 mb-8"}>
        Tickets available now
      </div>
      <div>
        <ImageWithFallback
          src={product.images[0].src}
          alt={product.images[0].alt}
          width={400}
          height={229}
          placeholder={product.images[0].placeholder}
        />
      </div>
      <h2 className={"text-2xl my-6"}>{product.name}</h2>
      <ProductAddToCart product={product} />
    </div>
  );
}

export default async function EventPage({
  params,
}: {
  params: Promise<{
    uid: string;
  }>;
}) {
  const { uid } = await params;
  const event = await fetchEventFromCmsByUid(uid);
  let product: Product | null = null;

  if (event?.tickets.productId) {
    product = await fetchProductFromCmsById(event.tickets.productId);
  }

  const productAvailable = product && isProductSellable(product).isSellable;

  if (
    !event ||
    event.options.visibility === "Hidden" ||
    event.options.externalEventLink
  ) {
    notFound();
  }

  const innerContentPages = await fetchInnerContentPagesForEvent(event.id);
  const isPastEvent = isEventCompleted(event);

  const defaultContent = [
    {
      label: "Lineup",
      content: <EventLineUp artists={event.artists} />,
      id: "lineup",
      sortingWeight: 200,
    },
    {
      label: "Location",
      id: "location",
      content: <EventLocation venue={event.venue} />,
      sortingWeight: 400,
    },
  ] as TabItem[];

  if (innerContentPages && innerContentPages?.length > 0) {
    innerContentPages.forEach(page => {
      defaultContent.push({
        label: page.title,
        content: (
          <div className={"max-lg:text-xs w-full"}>
            <SliceDisplay slices={page.slices} />
          </div>
        ),
        id: page.uid,
        sortingWeight: page.sortingWeight,
      });
    });
  }

  if (event.slices.length > 0) {
    defaultContent.push({
      label: "About",
      content: (
        <div>
          <SliceDisplay slices={event.slices} />
        </div>
      ),
      id: "overview",
      sortingWeight: 0,
      hideTitle: true,
    });
  }

  if (productAvailable && product) {
    defaultContent.push({
      label: "Tickets",
      content: <TicketDisplay product={product} />,
      id: "tickets",
      sortingWeight: 300,
      mobileOnly: true,
    });
  }

  return (
    <>
      <EventSeoMicrodata product={product} event={event} />
      <OuterPage className={"max-lg:pt-10"}>
        <PageHeadline
          title={event.name}
          segments={[
            { label: "Endemit", path: "" },
            { label: "Events", path: "events" },
            { label: event.name, path: event.uid },
          ]}
        />
        <div
          className={
            "absolute top-80 h-[600px] blur-2xl -left-10 -right-10 bg-cover animate-blurred-backdrop opacity-80 @container"
          }
          style={
            event.coverImage
              ? {
                  backgroundImage: `url('${getResizedPrismicImage(event.coverImage?.src, { width: 400, quality: 50 })}')`,
                }
              : {}
          }
        ></div>
        <div
          className={
            "absolute bottom-10 h-[800px] blur-2xl -left-10 -right-10 bg-cover animate-blurred-backdrop opacity-60 @container"
          }
          style={
            event.coverImage
              ? {
                  backgroundImage: `url('${getResizedPrismicImage(event.coverImage?.src, { width: 400, quality: 50 })}')`,
                }
              : {}
          }
        ></div>
        <div
          style={{
            backgroundImage: "url('/images/worms.png')",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "soft-light",
            backgroundSize: "150px",

            // backgroundColor: event.colour,
          }}
          className={"bg-neutral-950 relative"}
        >
          <div
            className={
              "flex justify-center relative max-lg:flex-col lg:items-stretch"
            }
          >
            <div className={"relative aspect-video lg:w-2/3 w-full"}>
              {event.artAuthor && (
                <Link
                  href={event.artAuthor.link}
                  target={"_blank"}
                  className={
                    "absolute  left-0 bottom-0 hover:bg-neutral-900 bg-neutral-900/60 py-1 px-1 text-xs text-neutral-600"
                  }
                >
                  Author: {event.artAuthor.text}
                </Link>
              )}
              {event.coverImage?.src && (
                <ImageWithFallback
                  src={event.coverImage?.src}
                  alt={event.coverImage?.alt ?? ""}
                  height={455}
                  width={809}
                  quality="100"
                  className="aspect-video w-full h-full object-cover"
                  placeholder={event.coverImage?.placeholder}
                />
              )}
            </div>
            <div
              className={
                "lg:w-1/3 text-neutral-200 p-4 lg:p-4 xl:p-8 lg:border-l-2 border-l-neutral-200 flex flex-col max-lg:gap-y-6 max-lg:items-center max-lg:py-12 gap-y-3"
              }
            >
              {event.date_start && event.date_end && (
                <div
                  className={
                    "uppercase max-lg:text-2xl lg:text-[clamp(0.7rem,2cqi,2rem)] flex-shrink-0"
                  }
                >
                  {formatEventDate(event.date_start, event.date_end)}
                  {isPastEvent && (
                    <div className={"text-neutral-400 text-sm"}>
                      This event has concluded
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 flex flex-col lg:@container lg:justify-center ">
                <div
                  className={clsx(
                    event.artists.length > 4 &&
                      "lg:overflow-y-auto  lg:max-h-56 scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-600 hover:scrollbar-thumb-neutral-500"
                  )}
                >
                  {event.artists.map(artist => (
                    <h3
                      className={
                        "max-lg:text-3xl lg:text-[clamp(1.7rem,20cqi,5rem)] lg:leading-[clamp(1.9rem,20.2cqi,5.2rem)] max-lg:text-center max-lg:w-full"
                      }
                      key={`artist-marquee-${artist.id}`}
                    >
                      {artist.name}
                    </h3>
                  ))}
                </div>
              </div>
              <div
                className={"flex gap-x-2 text-sm lg:text-md flex-shrink-0"}
                id={"overview"}
              >
                {event.venue?.logo && event.venue?.logo.src && (
                  <ImageWithFallback
                    src={event.venue?.logo.src}
                    alt={event.venue?.logo.src}
                    width={100}
                    height={32}
                    quality={85}
                    className="w-auto h-4"
                    placeholder={event.venue?.logo?.placeholder}
                  />
                )}
                {event.venue?.name}
              </div>
            </div>
          </div>
        </div>
        <div
          className={
            "-left-12 text-[clamp(4rem,4cqi,20rem)] w-[120%] leading-[clamp(4rem,4cqi,20rem)] relative text-neutral-950 uppercase font-heading flex text-center  justify-between overflow-hidden text-nowrap -scale-y-100"
          }
        >
          <div className={"animate-marquee-move"}>
            {Array(Math.ceil(200 / event.name.length))
              .fill(event.name)
              .join(" · ")}
          </div>
        </div>

        <div className={"relative flex"}>
          <div className={"lg:w-2/3 w-full"}>
            {!isPastEvent && (
              <ArtistCarousel artists={event.artists} headline={"Up next"} />
            )}
            <Tabs items={defaultContent} sortByWeight={true} />
          </div>

          <section className={"max-lg:hidden flex-1"}>
            <div
              className={" p-8 flex-1  bg-neutral-800 rounded-md h-fit"}
              style={{
                backgroundImage: "url('/images/worms.png')",
                backgroundRepeat: "repeat",
                backgroundBlendMode: "multiply",
                backgroundSize: "150px",

                // backgroundColor: event.colour,
              }}
            >
              {productAvailable && product && (
                <TicketDisplay product={product} />
              )}
              {!productAvailable && (
                <div className={"flex flex-col items-center text-neutral-200"}>
                  <div
                    className={
                      "font-heading uppercase text-3xl text-neutral-400 mb-8"
                    }
                  >
                    {isPastEvent || !product
                      ? `Tickets not available`
                      : `Tickets not available online`}
                  </div>
                  <div>
                    <ImageWithFallback
                      src={event.promoImage?.src}
                      alt={event.promoImage?.alt ?? ""}
                      width={400}
                      height={229}
                      placeholder={event.promoImage?.placeholder}
                    />
                  </div>
                  <h2 className={"text-2xl my-6"}>
                    {isPastEvent
                      ? "Tickets have been SOLD OUT."
                      : product
                        ? "Online tickets SOLD OUR"
                        : "Tickets are not for sale yet"}
                  </h2>
                  {!isPastEvent && (
                    <p>
                      Limited entry tickets available at the doors of the event
                      upon arrival.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className={"p4 text-center mt-10 "}>
              {event.date_start && (
                <div
                  className={
                    "text-neutral-200 text-2xl font-heading tracking-wider uppercase"
                  }
                >
                  {formatEventDateAndTime(event.date_start)}
                </div>
              )}
              <div className={"text-neutral-400 text-md font-thin "}>
                {event.venue?.name}
                <div>{event.venue?.address}</div>
              </div>
            </div>
          </section>
        </div>
      </OuterPage>
    </>
  );
}
