import { IntlShape } from "react-intl";

export const fmtTeamIndex = (index: number) => String(index).padStart(2, "0");
export const fmtScore = (score: number) => score.toFixed(2);

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

export const parseIntStrict = (value: string | number): number | undefined => {
  if (typeof value === "number") {
    return Math.trunc(value);
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    return undefined;
  }

  return parsed;
};

/**
 * 32-bit Mulberry32 PRNG. Generates floating point numbers between 0 and 1.
 */
function createPRNG(seed: number): () => number {
  let state = seed;
  return function () {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts a string seed into a 32-bit integer hash.
 */
function hashSeed(seed: string | number): number {
  if (typeof seed === "number") return seed;

  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

/**
 * Shuffles an array deterministically based on a seed without mutating the original array.
 */
export function seededShuffle<T>(
  array: readonly T[],
  seed: string | number,
): T[] {
  const result = [...array];
  const random = createPRNG(hashSeed(seed));

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
