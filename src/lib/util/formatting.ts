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
    timeZone: "Europe/Ljubljana",
  });
};

export const formatDay = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Europe/Ljubljana",
  });
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "2-digit",
    timeZone: "Europe/Ljubljana",
  });
};

export const formatDateTime = (date: Date) => {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Ljubljana",
  });
};

export const formatEventDate = (dateFrom: Date, dateTo: Date) => {
  const hoursDiff = (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60);

  if (hoursDiff > 18) {
    const dayFrom = dateFrom.getDate();
    const dayTo = dateTo.getDate();
    const month = dateFrom.toLocaleDateString("en-US", {
      month: "long",
      timeZone: "Europe/Ljubljana",
    });
    const year = dateFrom.getFullYear().toString().slice(-2);

    return `${dayFrom} - ${dayTo} ${month} ${year}`;
  }

  return formatDate(dateFrom);
};

export const formatEventDateAndTime = (date: Date) => {
  return `${formatDate(date)} @ ${formatTime(date)}`;
};

export const formatWeight = (number: number) => {
  return `${formatNumber(number, 3)} kg`;
};

export const formatDayName = (date: Date) => {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    timeZone: "Europe/Ljubljana",
  });
};
