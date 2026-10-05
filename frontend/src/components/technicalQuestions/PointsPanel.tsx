import { TechnicalQuestionMode } from "./types";

import {
  Button,
  Grid,
  Group,
  NumberInput,
  Slider,
  Stack,
  Text,
} from "@mantine/core";

import { IconAlertTriangleFilled } from "@tabler/icons-react";

type PointsPanelProps = {
  minPoints?: number | "";
  maxPoints?: number | "";
  numericScore?: number;
  binaryScore?: boolean;
  binaryChoice?: boolean;
  onChangeMinPoints?: (newMinPoints: number | "") => void;
  onChangeMaxPoints?: (newMaxPoints: number | "") => void;
  onChangeScore?: (newScore: number) => void;
  onCommitScore?: (newScore: number) => void;
  mode: TechnicalQuestionMode;
};

const PointsPanel = ({
  minPoints: rawMinPoints,
  maxPoints: rawMaxPoints,
  numericScore,
  binaryScore,
  binaryChoice,
  onChangeMinPoints,
  onChangeMaxPoints,
  onChangeScore,
  onCommitScore,
  mode,
}: PointsPanelProps) => {
  const minPoints = rawMinPoints === "" ? undefined : rawMinPoints;
  const maxPoints = rawMaxPoints === "" ? undefined : rawMaxPoints;
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
            value={rawMinPoints}
            onChange={(value) =>
              onChangeMinPoints?.(typeof value === "number" ? value : "")
            }
            allowDecimal={false}
            hideControls
            w={"100%"}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          {binaryChoice ? (
            <Group w={"100%"} justify="center">
              <Button.Group>
                <Button
                  disabled={pointsReadOnly}
                  variant={
                    numericScore !== undefined && !binaryScore
                      ? "filled"
                      : "default"
                  }
                  onClick={() =>
                    minPoints !== undefined && onCommitScore?.(minPoints)
                  }
                >
                  No
                </Button>
                <Button
                  disabled={pointsReadOnly}
                  variant={
                    numericScore !== undefined && binaryScore
                      ? "filled"
                      : "default"
                  }
                  onClick={() =>
                    maxPoints !== undefined && onCommitScore?.(maxPoints)
                  }
                >
                  Yes
                </Button>
              </Button.Group>
            </Group>
          ) : (
            <Slider
              w={"100%"}
              disabled={pointsReadOnly}
              min={minPoints}
              max={maxPoints}
              value={numericScore ?? minPoints}
              color={numericScore === undefined ? "gray" : undefined}
              onChange={onChangeScore}
              onChangeEnd={onCommitScore}
            />
          )}
        </Grid.Col>
        <Grid.Col span={3}>
          <NumberInput
            readOnly={intervalReadOnly}
            value={rawMaxPoints}
            onChange={(value) =>
              onChangeMaxPoints?.(typeof value === "number" ? value : "")
            }
            allowDecimal={false}
            hideControls
            w={"100%"}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default PointsPanel;
