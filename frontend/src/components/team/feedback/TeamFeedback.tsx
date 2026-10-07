import ScoreDisplay from "../ScoreDisplay";
import JuryFeedback from "./JuryFeedback";
import PublicFeedback from "./PublicFeedback";
import SidequestFeedback from "./SidequestFeedback";
import TechnicalFeedback from "./TechnicalFeedback";

import { TeamRanking } from "@/api/gen/schemas";
import { useResolveParams } from "@/hooks/useResolveParams";

import { Group, Loader, Stack, Title } from "@mantine/core";

type TeamFeedbackProps = {
  entry: TeamRanking;
  // the admin view leaves out the overview
  adminView?: boolean;
  // only used outside the admin view
  maxTotalPoints?: number;
};

const TeamFeedback = ({
  entry,
  adminView = false,
  maxTotalPoints = 0,
}: TeamFeedbackProps) => {
  const { event } = useResolveParams();

  if (!event) {
    return <Loader />;
  }

  return (
    <Stack>
      {!adminView && (
        <>
          <Group justify="space-between">
            <Title order={3}>Feedback</Title>
            <Title order={3} c="dimmed">
              Overall Rank #{entry.rank}
            </Title>
          </Group>
          <ScoreDisplay entry={entry} maxTotalPoints={maxTotalPoints} />
        </>
      )}

      <TechnicalFeedback entry={entry} eventId={event.id} />
      <JuryFeedback entry={entry} />
      {entry.finalist && <PublicFeedback entry={entry} />}
      <SidequestFeedback entry={entry} />
    </Stack>
  );
};

export default TeamFeedback;
