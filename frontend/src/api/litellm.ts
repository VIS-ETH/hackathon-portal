// Name of the team secret that holds the generated LiteLLM key (see the backend).
export const AI_API_KEY_SECRET_NAME = "AI API Key";

export async function getKeyInfo(
  liteLLMUrl: string,
  apiKey: string,
): Promise<{ usedBudget: number; maxBudget: number }> {
  const keyUrl = `${liteLLMUrl}/key/info?key=${apiKey}`;
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

  const teamUrl = `${liteLLMUrl}/team/info?team_id=${teamId}`;

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
