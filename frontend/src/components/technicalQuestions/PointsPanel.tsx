import {
  Grid,
  Group,
  NumberInput,
  Slider,
  Stack,
  Switch,
  Text,
} from "@mantine/core";

import { IconAlertTriangleFilled } from "@tabler/icons-react";

type PointsPanelProps = {
  minPoints?: number;
  maxPoints?: number;
  numericScore?: number;
  binaryScore?: boolean;
  binaryChoice?: boolean;
  onChangeMinPoints?: (newMinPoints: number) => void;
  onChangeMaxPoints?: (newMaxPoints: number) => void;
  onChangeScore?: (newScore: number) => Promise<void>;
  mode: "view" | "edit" | "grading" | "feedback" | "create";
};

const PointsPanel = ({
  minPoints,
  maxPoints,
  numericScore,
  binaryScore,
  binaryChoice,
  onChangeMinPoints,
  onChangeMaxPoints,
  onChangeScore,
  mode,
}: PointsPanelProps) => {
  // Points panel implementation would go here

  const intervalReadOnly = !(mode === "edit" || mode === "create");
  const pointsReadOnly = !(mode === "grading");

  if (mode === "feedback") {
    return (
      <Text>
        {binaryChoice ? (binaryScore ? maxPoints : minPoints) : numericScore} /{" "}
        {maxPoints}
      </Text>
    );
  }

  return (
    <Stack align="center">
      {mode === "grading" && (
        <>
          {numericScore == undefined ? (
            <Group>
              <IconAlertTriangleFilled />
              <Text>ungraded</Text>
            </Group>
          ) : (
            <Text>{numericScore}</Text>
          )}
        </>
      )}
      <Grid align="center">
        <Grid.Col span={3}>
          <NumberInput
            readOnly={intervalReadOnly}
            value={minPoints}
            onChange={(value) => onChangeMinPoints?.((value as number) || 0)}
            hideControls
            w={"100%"}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          {binaryChoice ? (
            <Group w={"100%"} justify="center">
              <Switch
                readOnly={pointsReadOnly}
                checked={binaryScore}
                onChange={(event) => {
                  if (maxPoints === undefined || minPoints === undefined)
                    return;
                  if (event.currentTarget.checked) {
                    onChangeScore?.(maxPoints);
                  } else {
                    onChangeScore?.(minPoints);
                  }
                }}
              />
            </Group>
          ) : (
            <Slider
              w={"100%"}
              disabled={pointsReadOnly}
              min={minPoints}
              max={maxPoints}
              value={numericScore}
              onChange={onChangeScore}
            />
          )}
        </Grid.Col>
        <Grid.Col span={3}>
          <NumberInput
            readOnly={intervalReadOnly}
            value={maxPoints}
            onChange={(value) => onChangeMaxPoints?.((value as number) || 0)}
            hideControls
            w={"100%"}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default PointsPanel;
