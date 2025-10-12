import { fmtScore } from "@/utils";

import { Progress, Tooltip } from "@mantine/core";

type ScoreDisplayProps = {
  presentation_score: number;
  sidequest_score: number;
  public_voting_score: number;
  technical_score: number;
  extra_score: number;
  max_score: number;
};

const ScoreDisplay = ({
  presentation_score,
  sidequest_score,
  public_voting_score,
  technical_score,
  extra_score,
  max_score,
}: ScoreDisplayProps) => {
  const calculatePercentage = (score: number | undefined) => {
    if (score === undefined) return 0;
    return (score / max_score) * 100;
  };

  return (
    <Progress.Root size={30}>
      <Tooltip label={`Technical: ${fmtScore(technical_score)}`} withArrow>
        <Progress.Section
          value={calculatePercentage(technical_score)}
          color="cyan"
        >
          <Progress.Label>{fmtScore(technical_score)}</Progress.Label>
        </Progress.Section>
      </Tooltip>
      <Tooltip label={`Expert: ${fmtScore(presentation_score)}`} withArrow>
        <Progress.Section
          value={calculatePercentage(presentation_score)}
          color="pink"
        >
          <Progress.Label>{fmtScore(presentation_score)}</Progress.Label>
        </Progress.Section>
      </Tooltip>
      <Tooltip label={`Sidequests: ${fmtScore(sidequest_score)}`} withArrow>
        <Progress.Section
          value={calculatePercentage(sidequest_score)}
          color="orange"
        >
          <Progress.Label>{fmtScore(sidequest_score)}</Progress.Label>
        </Progress.Section>
      </Tooltip>
      <Tooltip label={`Voting: ${fmtScore(public_voting_score)}`} withArrow>
        <Progress.Section
          value={calculatePercentage(public_voting_score)}
          color="teal"
        >
          <Progress.Label>{fmtScore(public_voting_score)}</Progress.Label>
        </Progress.Section>
      </Tooltip>
      <Tooltip label={`Bonus: ${fmtScore(extra_score)}`} withArrow>
        <Progress.Section
          value={calculatePercentage(extra_score)}
          color="green"
        >
          <Progress.Label>{fmtScore(extra_score)}</Progress.Label>
        </Progress.Section>
      </Tooltip>
    </Progress.Root>
  );
};

export default ScoreDisplay;
