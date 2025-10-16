interface Props {
  trackUrl: string;
  artistName?: string;
  artistUrl?: string;
  trackTitle: string;
  trackTitleUrl: string;
  className?: string;
}

export default function SoundCloudEmbed({
  trackUrl,
  artistName = "Endemit",
  artistUrl = "https://soundcloud.com/ende-mit",
  trackTitle,
  trackTitleUrl,
  className = "mt-8",
}: Props) {
  const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;

  return (
    <>
      <iframe
        width="100%"
        height="166"
        scrolling="no"
        frameBorder="no"
        className={`rounded-md ${className}`}
        allow="autoplay"
        src={embedUrl}
      />
      <div
        style={{
          fontSize: "10px",
          color: "#cccccc",
          lineBreak: "anywhere",
          wordBreak: "normal",
          overflow: "hidden",
          fontFamily:
            "Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif",
          fontWeight: 100,
          marginTop: "6px",
        }}
      >
        <a
          href={artistUrl}
          title={artistName}
          target="_blank"
          style={{ color: "#cccccc", textDecoration: "none" }}
        >
          {artistName}
        </a>
        {" · "}
        <a
          href={trackTitleUrl}
          title={trackTitle.split(" · ")[0]}
          target="_blank"
          style={{ color: "#cccccc", textDecoration: "none" }}
        >
          {trackTitle}
        </a>
      </div>
    </>
  );
}
