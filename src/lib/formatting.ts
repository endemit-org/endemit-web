export const formatPrice = (price: number, decimals: number = 0) => {
  return price.toLocaleString("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatDecimalPrice = (price: number) => formatPrice(price, 2);

export const formatNumber = (number: number, decimals: number = 0) => {
  return number.toLocaleString("sl-SI", {
    style: "decimal",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatTime = (date: Date) => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatDay = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
  });
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "2-digit",
  });
};

export const formatDateTime = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatEventDateAndTime = (date: Date) => {
  return `${formatDate(date)} @ ${formatTime(date)}`;
};

export const formatWeight = (number: number) => {
  return `${formatNumber(number, 3)} kg`;
};
