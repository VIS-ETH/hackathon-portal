import { TeamRanking } from "@/api/gen/schemas";
import { fmtScore } from "@/utils";

import { useState } from "react";

import { Progress, Tooltip } from "@mantine/core";

import { useElementSize } from "@mantine/hooks";

type ScoreDisplayProps = {
  entry: TeamRanking;
  maxTotalPoints: number;
};

// A label (bold digits just over 10px wide, plus 4px padding per side) shows only
// where it fits; the tooltip always has the value.
const labelFits = (label: string, sectionWidth: number) =>
  sectionWidth >= label.length * 11 + 8;

const ScoreDisplay = ({ entry, maxTotalPoints }: ScoreDisplayProps) => {
  const { ref, width } = useElementSize();
  // A hidden bar measures 0 wide (e.g. in a hidden tab, or briefly while a browser
  // captures a full-page screenshot); keep the labels of the last real width.
  const [barWidth, setBarWidth] = useState(0);
  if (width > 0 && width !== barWidth) {
    setBarWidth(width);
  }

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
    <Progress.Root ref={ref} size={30} radius="md">
      {sections.map(({ label, points, color }) => {
        const value = Math.round(points).toString();
        const sectionWidth = (percentage(points) / 100) * barWidth;

        return (
          <Tooltip
            key={label}
            label={`${label}: ${fmtScore(points)}`}
            withArrow
          >
            <Progress.Section value={percentage(points)} color={color}>
              {labelFits(value, sectionWidth) && (
                <Progress.Label>{value}</Progress.Label>
              )}
            </Progress.Section>
          </Tooltip>
        );
      })}
    </Progress.Root>
  );
};

export default ScoreDisplay;
