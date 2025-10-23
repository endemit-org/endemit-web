import {
  Html,
  Head,
  Body,
  Container,
  Hr,
  Text,
  Section,
  Img,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";

interface Props {
  children: React.ReactNode;
}

function Logo() {
  return (
    <Img
      src={`${PUBLIC_BASE_WEB_URL}/images/endemit-logo.png`}
      width={60}
      alt="ENDEMIT"
      className="mx-auto block"
      style={{
        display: "block",
        margin: "0 auto",
        colorScheme: "light only",
      }}
    />
  );
}

function MasterTemplate({ children }: Props) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Body
          className="bg-neutral-100 font-sans rounded-lg"
          data-color-mode="light"
          data-light-theme="light"
        >
          <Container className="mx-auto my-12 max-w-2xl bg-white">
            {/* Header with Logo */}
            <Section className=" py-8 px-6 text-center">
              <Logo />
            </Section>

            {/* Main Content Container - White Box */}
            <Section className=" px-8 py-10">{children}</Section>

            {/* Footer */}
            <Section className=" px-8 py-6">
              <Hr className="border-gray-800 mb-6" />

              <Text className="text-neutral-800 text-xs text-center">
                © {new Date().getFullYear()} Endemit
              </Text>
              <Text className="text-neutral-500 text-xs text-center mt-2">
                Kulturno društvo Endemit
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export { MasterTemplate };
