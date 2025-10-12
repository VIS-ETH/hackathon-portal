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

export async function getKeyInfo(
  apiKey: string,
): Promise<{ usedBudget: number; maxBudget: number }> {
  const keyUrl = `https://${process.env.NEXT_PUBLIC_AI_PROXY_HOST}/key/info?key=${apiKey}`;
  let teamId;
  try {
    const response = await fetch(keyUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-litellm-api-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    teamId = data.info.team_id;
  } catch (error) {
    console.error("Error fetching key info:", error);
    throw error;
  }

  const teamUrl = `https://${process.env.NEXT_PUBLIC_AI_PROXY_HOST}/team/info?team_id=${teamId}`;

  try {
    const response = await fetch(teamUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-litellm-api-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();
    const maxBudget = data.team_info.max_budget;
    const usedBudget = data.team_info.spend;
    return { usedBudget, maxBudget };
  } catch (error) {
    console.error("Error fetching team info:", error);
    throw error;
  }
}
