interface Props {
  url: string;
  height?: number;
  color?: string;
  autoPlay?: boolean;
  showRelated?: boolean;
  showComments?: boolean;
  showUser?: boolean;
  showReposts?: boolean;
  showTeaser?: boolean;
  className?: string;
  visual?: boolean;
}

export default function EmbedSoundCloud({
  url,
  height = 350,
  color = "000000",
  autoPlay = false,
  showRelated = false,
  showComments = true,
  showUser = true,
  showReposts = false,
  showTeaser = false,
  visual = false,
  className = "",
}: Props) {
  const encodedUrl = encodeURIComponent(url);
  const embedUrl = `https://w.soundcloud.com/player/?url=${encodedUrl}&color=${color}&visual=${visual}&auto_play=${autoPlay}&hide_related=${!showRelated}&show_comments=${showComments}&show_user=${showUser}&show_reposts=${showReposts}&show_teaser=${showTeaser}`;

  return (
    <iframe
      width="100%"
      height={height}
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      src={embedUrl}
      className={className}
    />
  );
}
