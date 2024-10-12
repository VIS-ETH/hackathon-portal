import { IntlShape } from "react-intl";

export const fmtTeamIndex = (index: number) => String(index).padStart(2, "0");

export const fmtDateWeekdayTime = (value: string, intl: IntlShape) =>
  intl.formatDate(value, {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

export const resizeArray = <T>(
  arr: T[],
  newSize: number,
): (T | undefined)[] => {
  if (newSize < 0) {
    throw new Error("New size must be non-negative.");
  }

  if (newSize < arr.length) {
    return arr.slice(0, newSize);
  } else if (newSize > arr.length) {
    return arr.concat(Array(newSize - arr.length).fill(undefined));
  } else {
    return arr;
  }
};
