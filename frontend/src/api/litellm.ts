// Name of the team secret that holds the generated LiteLLM key (see the backend).
export const AI_API_KEY_SECRET_NAME = "AI API Key";

export async function getKeyInfo(
  liteLLMUrl: string,
  apiKey: string,
): Promise<{ usedBudget: number; maxBudget: number }> {
  const keyUrl = `${liteLLMUrl}/key/info?key=${apiKey}`;
  const keyResponse = await fetch(keyUrl, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-litellm-api-key": apiKey,
    },
  });

  if (!keyResponse.ok) {
    throw new Error(`Request failed with status ${keyResponse.status}`);
  }

  const keyData = await keyResponse.json();
  const teamId = keyData.info.team_id;

  const teamUrl = `${liteLLMUrl}/team/info?team_id=${teamId}`;
  const teamResponse = await fetch(teamUrl, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-litellm-api-key": apiKey,
    },
  });

  if (!teamResponse.ok) {
    throw new Error(`Request failed with status ${teamResponse.status}`);
  }

  const teamData = await teamResponse.json();
  const maxBudget = teamData.team_info.max_budget;
  const usedBudget = teamData.team_info.spend;
  return { usedBudget, maxBudget };
}
