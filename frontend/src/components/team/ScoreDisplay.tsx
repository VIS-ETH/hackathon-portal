import { TeamRanking } from "@/api/gen/schemas";
import { fmtScore } from "@/utils";

import { Progress, Tooltip } from "@mantine/core";

type ScoreDisplayProps = {
  entry: TeamRanking;
  maxTotalPoints: number;
};

const ScoreDisplay = ({ entry, maxTotalPoints }: ScoreDisplayProps) => {
  const sections = [
    { label: "Technical", points: entry.technical.points, color: "cyan" },
    { label: "Jury", points: entry.jury.points, color: "pink" },
    { label: "Public", points: entry.public.points, color: "teal" },
    { label: "Sidequests", points: entry.sidequest.points, color: "orange" },
    { label: "Extra", points: entry.extra_points, color: "green" },
  ];

  // all teams have 0 points, e.g. before any rating
  const percentage = (points: number) =>
    maxTotalPoints === 0 ? 0 : (points / maxTotalPoints) * 100;

  return (
    <Progress.Root size={30} radius="md">
      {sections.map(({ label, points, color }) => (
        <Tooltip key={label} label={`${label}: ${fmtScore(points)}`} withArrow>
          <Progress.Section value={percentage(points)} color={color}>
            <Progress.Label>{fmtScore(points)}</Progress.Label>
          </Progress.Section>
        </Tooltip>
      ))}
    </Progress.Root>
  );
};

export default ScoreDisplay;
