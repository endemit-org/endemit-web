export default function SeoSchema({ children }: { children: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(children),
      }}
    />
  );
}
