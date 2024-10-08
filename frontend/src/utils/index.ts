export const fmtTeamIndex = (index: number) => {
  return String(index).padStart(2, "0");
};

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
