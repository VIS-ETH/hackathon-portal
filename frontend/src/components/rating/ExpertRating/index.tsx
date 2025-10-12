import { ExpertRatingCategory } from "@/api/gen/schemas";

import { useState } from "react";

import { Group, Rating, Stack, Text, Tooltip } from "@mantine/core";

export type ExpertRatingGenericProps = {
  teamId: string;
  category: ExpertRatingCategory;
  description?: string;
};

type ExpertRatingProps = {
  category: ExpertRatingCategory;
  description?: string;
  feedbackOnly?: boolean;
  rating: number;
  setRating?: (rating: number) => void;
};

const ExpertRating = ({
  category,
  description,
  feedbackOnly,
  rating,
  setRating,
}: ExpertRatingProps) => {
  const [hover, setHover] = useState(0);

  const scaleDescription = SCALE_DESCRIPTIONS.get(Math.floor(hover / 2) * 2);

  return (
    <Group align="center" justify="space-between">
      <Stack gap={0}>
        <Text>{category}</Text>
        {description && <Text c="dimmed">{description}</Text>}
      </Stack>
      <Tooltip
        label={
          feedbackOnly
            ? `${hover.toFixed(1)}`
            : `${hover.toFixed(1)}: ${scaleDescription}`
        }
        disabled={feedbackOnly}
      >
        <Rating
          count={Math.max(...Array.from(SCALE_DESCRIPTIONS.keys()))}
          fractions={2}
          value={rating ?? 0}
          onChange={(value) => setRating?.(value)}
          onHover={setHover}
          readOnly={feedbackOnly}
        />
      </Tooltip>
    </Group>
  );
};

const SCALE_DESCRIPTIONS = new Map([
  [0, "Non-existent, not measurable"],
  [2, "Poor"],
  [4, "Pass, sufficient, minimum working product"],
  [6, "Good, satisfactory"],
  [8, "Very good, excellent"],
  [10, "Outstanding, way above expectations"],
]);

export default ExpertRating;
