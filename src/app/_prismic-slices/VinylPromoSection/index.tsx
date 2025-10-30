import React, { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import ProductAddToCart from "@/app/_components/product/ProductAddToCart";
import { fetchProductFromCmsById } from "@/domain/cms/operations/fetchProductFromCms";
import InnerPage from "@/app/_components/content/InnerPage";
import Link from "next/link";
import ActionButton from "@/app/_components/form/ActionButton";
import InnerClientToggle from "@/app/_prismic-slices/VinylPromoSection/InnerClientToggle";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";

/**
 * Props for `VinylPromoSection`.
 */
export type VinylPromoSectionProps =
  SliceComponentProps<Content.VinylPromoSectionSlice>;

/**
 * Component for "VinylPromoSection" Slices.
 */
const VinylPromoSection: FC<VinylPromoSectionProps> = async ({ slice }) => {
  if (!slice.primary.product) {
    return;
  }

  const productObject = slice.primary.product;

  // @ts-expect-error - ID does exist on the product
  const product = await fetchProductFromCmsById(productObject.id);

  if (!product) {
    return;
  }

  const bluredCoverPlaceholder = `data:image/svg+xml;base64,CiAgICA8c3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgdmlld0JveD0nMCAwIDggNSc+CiAgICAgIDxmaWx0ZXIgaWQ9J2InIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0nc1JHQic+CiAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0nMScgLz4KICAgICAgPC9maWx0ZXI+CgogICAgICA8aW1hZ2UgcHJlc2VydmVBc3BlY3RSYXRpbz0nbm9uZScgZmlsdGVyPSd1cmwoI2IpJyB4PScwJyB5PScwJyBoZWlnaHQ9JzEwMCUnIHdpZHRoPScxMDAlJwogICAgICBocmVmPSdkYXRhOmltYWdlL2F2aWY7YmFzZTY0LFVrbEdScmdDQUFCWFJVSlFWbEE0V0FvQUFBQVFBQUFBTVFBQU1RQUFRVXhRU0NjQUFBQUJKeUFRU1B5aFA0MklDQmJNQkV3Q1dzQVFOS0IvdndYd2lPai9CS1Q0Q0Yvc25vekJsT0lBVmxBNElHb0NBQUNRRFFDZEFTb3lBRElBUG8wMGxVZWxJcUloTWZqc2tLQVJpV3dBeUJmQ3hUZkc4ZXI3WjREYnBlWUQ5ZFBXeDlEZThsN3pQL21YNkVab1hVdHkzM0oxUCtMN1VFNHJVL0F5MndxS1NVL3UwcWh5MmtidHpzano1N1AxcEtiTlZENFJFejBMU2dmRy9RYit6elR5N1U3di84bFNkNEFBL3U3QWRKWnlJM3pvZ1YrNGl4QlZTLy84L00vWi91bVhhNnNUYnYvOGxQb2hydWZVMThQVGx3eGhTTjVKaGFpOFMvN0E5ZHFndlRGM2thd0tTR2dRdWV1VHQzM2oyaUJ3N1orNVpiM2puaEJva3RaMmFHOTJtNmxNai9JTWpnSE94TnNyTmsvR2llQ2FTWXFUUXhyaS85TWRRUU15ZmJNbnUwbGdXQzZJR1NRbXlBUmNYaEIrdTRoUFh6MGp0WXZnYy9mRlM3YWJ2UmY0WHdPU2lRYmdFWG9NSnVFTVgwZ0M4RDBWOExwMm1XN0paa3Btd1B0VnJtY3dKQmlZbjFLdWJ5ei9hVHgzSTh6UElhNnFEeGNOZUtxeENaTk15NDREWlV4bjloZWRtQ3VQcXdGYTdpeFF5ZVhmYzgvNDJvdEUrSUQ5T0NqLytUL2hHVWp6MW5sb0x0RWN6VHRmVmZNRTBCdWRFaUk3SjlMWDhzSVZMRlJqeGdoVUg1SW1hcTUrTFZlZytkcGJrSmg5aUcvd2RoaTZxUGZ4M2UwSnZydGlEUk50TUZKTTBIZ0RGa1lQYW9oNi9Eb0dXTm1yQVJOTFpNZUdyM1FFOXZDSkRvQ0lHVjJrdUNha1U1TjZKcko0ZWlJb1hNOWM0aDQ2SENwTTJBOERvK3V2RDI2dGdSMHZiQVFzTmk1b1ErajdZSzV4emV0TzVnYythcTI0NjJ4ZnJtU1RUZ3ZGV24zaXZFN0Fod1JyZzZzVG1jR2hveTVJc2hpZXJlaHpRUWc3QzE4UUFoYVVYNDFzL3hFdU1VY1hWTWRoK2J4dkl0cmx6R295WE1rUExxVTd5Q3Q2UllpZlBVbjl2MDBQZTJOMlFqOUVDRXJVZzY2QUFBQT0nIC8+CiAgICA8L3N2Zz4KICA=`;
  const bluredRecordPlaceholder = `data:image/svg+xml;base64,CiAgICA8c3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgdmlld0JveD0nMCAwIDggNSc+CiAgICAgIDxmaWx0ZXIgaWQ9J2InIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0nc1JHQic+CiAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0nMScgLz4KICAgICAgPC9maWx0ZXI+CgogICAgICA8aW1hZ2UgcHJlc2VydmVBc3BlY3RSYXRpbz0nbm9uZScgZmlsdGVyPSd1cmwoI2IpJyB4PScwJyB5PScwJyBoZWlnaHQ9JzEwMCUnIHdpZHRoPScxMDAlJwogICAgICBocmVmPSdkYXRhOmltYWdlL2F2aWY7YmFzZTY0LFVrbEdSdW9DQUFCWFJVSlFWbEE0V0FvQUFBQVFBQUFBTVFBQU1RQUFRVXhRU0hFQkFBQUJnS050MjJIbnY2NlprOUpXYWR0Y2gxR3ljNVl3Vld5amNpb2ZZd214Y1d3amZ6ei9mTE9CaUdEZ3RwR2laSThacDI5QTdBWVhkeTdKbjh3ZWovVkZ0ZFpiRm9xNFN1WDBDVFYrL0k5K25YU2trT1kwVnJXZ3hnVHExdW9GeENTUEd6R2hscmtNTXVqR1M4ekJ1NDRnQXNJWUIrYWthenlTbGJndHpObWRKTGJ1RUFONDlIOEwyOElnYnYrM2tHWXdrS09DdnpRNm9IQzEvWDMrbHhqTW0vVGZiOWc0Qm5TRy9xSEtDSW01OW1lNGdFRmRvUkhLVmNPaXpVZW9Id003aElLRlJIejgyUk1SNHBCaURla1krWWkydE5OUDFIRnEvdTVsRE82S25HakljYUI4eHVDK21PR3h1SW1SaUlqeGtDTTZJNGVIQ2ZNelBNODg3RWpPdzV1enhNUGIyUW4vQldpSzRiOHlZVEQ4bDl5SFVJNGFGblVPL0I5cGdRTC82eGtyNGYrczR4VDQzL3NpR2J4Q09CcmdxeEJEZzFlNnJURHdhbm9RQjE2eHQrS2dVNEdEQ1lOT0hoY05OSEM2TVk0bkF5Y285VUlsQlpyU05NSytITll4OGlUb2RwdWY1RXVkeGNHSVZRUUFWbEE0SUZJQkFBQ1FDQUNkQVNveUFESUFQcEZHbkV1bG82S3NvZ29oa0JJSlpRQUQ1ZTV2b3JSYjZXZVpPaGhjRGxJRlU0U2hVSWkrdERMTmpsd0k4Q3pJVG9VZUlHa0Y5QUhMODNhSGJnVXI0S0NjaUFEKys4ZGsvbGk4S1NESUtXS1lrOEdPOFdWdUtuc3JsQ2c0VS9XdlVhTmVFOWEzMjNMNzVkdTEvdjZtb1gvOXlqUC9lK0lES1VkV2JTYk94TWRjbDhwZ0g3ZTZiYnNqeU1waHBid1E1eFlFamQwNHhjQXZWZzVDVjhFNDlIclpvM1NsR2tJbXM5MjcyTkNoMFYwZXhVZHpYOFMzczBGenNwTy8vNUQxcUZlN2FmMi9icUpvaWNLZlBjbys5SUdhdi8xNUxKamRkVlMvaDRILzNzZjZnaWxqM25WYU5HUXNuZkNmVTFSenJKM21wcS8ydDdDckZYV0NSeStUeHphaU1iNlFTc1RkRzJZbVFWdnd6enNYcmpnM0RKQy90eHo4SnVYYlBYMEVRK0lSYWo1ZVVoVVQrazZVSDN0Z0VnbUN4T2wxSzVQL1hodi9CK2UvbFU4L0IvL1hnQUFBQUE9PScgLz4KICAgIDwvc3ZnPgogIA==`;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <InnerPage
        className={
          "flex overflow-hidden gap-x-20 !bg-[#d3532c] justify-evenly max-lg:flex-col max-lg:gap-y-10 items-center"
        }
      >
        <div className="absolute bottom-0  right-0 scale-[200%]">
          <ImageWithFallback
            src="/images/issun-boshi-vinyl-release/album/issun-boshi-cover.webp"
            alt="Issun-bōshi Vinyl release"
            width={400}
            height={400}
            quality={50}
            className="blur-2xl animate-blurred-backdrop"
            placeholder={bluredCoverPlaceholder}
          />
        </div>

        <div className="relative z-10 group pt-[20%]  group">
          <InnerClientToggle placeholder={bluredCoverPlaceholder} />
          <div className="absolute top-0">
            <ImageWithFallback
              src="/images/issun-boshi-vinyl-release/album/issun-boshi-record.webp"
              alt="Issun-bōshi Vinyl release EP"
              width={600}
              height={600}
              quality={100}
              className="animate-slow-spin rounded-full"
              placeholder={bluredRecordPlaceholder}
            />
          </div>
        </div>
        {slice.primary.display_add_to_cart && (
          <div className="relative z-10 text-center max-w-md">
            <h2 className={"text-4xl mt-6"}>
              <Link
                href={"/store/albums/issun-boshi-vinyl-ep"}
                className={"link text-neutral-200 hover:text-neutral-300"}
              >
                {slice.primary.headline}
              </Link>
            </h2>
            <div className={"font-light pt-0 text-lg"}>MMali • Issun-bōshi</div>
            <div className={"text-xl my-6 font-thin"}>
              {slice.primary.description}
            </div>
            <ProductAddToCart product={product} />
            <div className={"mt-3 gap-y-3 flex flex-col  items-center"}>
              <div>or</div>
              <div className={"w-fit"}>
                <ActionButton
                  variant={"secondary"}
                  openInNewTab={true}
                  size={"sm"}
                  href={"https://endemit.bandcamp.com/album/issun-boshi"}
                >
                  Buy digital album
                </ActionButton>
              </div>
            </div>
          </div>
        )}
      </InnerPage>
    </section>
  );
};

export default VinylPromoSection;
