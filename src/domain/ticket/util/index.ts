export const splitArtistsIntoLines = (
  artists: string[],
  dividerSymbol = "•"
): string[] => {
  const midpoint = Math.ceil(artists.length / 2);

  const firstLine = artists.slice(0, midpoint).join(` ${dividerSymbol} `);
  const secondLine = artists.slice(midpoint).join(` ${dividerSymbol} `);

  return [firstLine, secondLine];
};
