import { Ticket } from "@prisma/client";
import { SerializedTicket, TicketPayload } from "@/domain/ticket/types/ticket";

export const splitArtistsIntoLines = (
  artists: string[],
  dividerSymbol = "•"
): string[] => {
  const midpoint = Math.ceil(artists.length / 2);

  const firstLine = artists.slice(0, midpoint).join(` ${dividerSymbol} `);
  const secondLine = artists.slice(midpoint).join(` ${dividerSymbol} `);

  return [firstLine, secondLine];
};

export const serializeTicket = (ticket: Ticket) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, updatedAt, ...data } = ticket;

  return {
    ...data,
    price: Number(ticket.price),
  } as SerializedTicket;
};

export const normaliseJsonInput = (payload: TicketPayload) =>
  Object.keys(payload)
    .sort()
    .reduce((sorted, key) => {
      // @ts-expect-error unnecesary issue by TS
      sorted[key] = payload[key];
      return sorted;
    }, {}) as TicketPayload;

export const playBeep = () => {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 5800;
  oscillator.type = "sine";
  gainNode.gain.value = 0.9;

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
};

export const playBlorp = () => {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 200;
  oscillator.type = "sawtooth";
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.3
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};
