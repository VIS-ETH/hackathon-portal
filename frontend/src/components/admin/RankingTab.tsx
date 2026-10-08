import TechnicalQuestions from "../technicalQuestions/TechnicalQuestionList";

import RankingPanel from "@/components/admin/RankingPanel";
import { confirmDiscard } from "@/hooks/useUnsavedChanges";
import { segmentedControlProps } from "@/styles/common";

import { useState } from "react";

import { Group, SegmentedControl, Stack } from "@mantine/core";

type RankingTabProps = {
  eventId: string;
};

const RankingTab = ({ eventId }: RankingTabProps) => {
  const views = ["Ranking", "Technical Questions"];
  const [currentView, setCurrentView] = useState("Ranking");

  return (
    <Stack>
      <Group>
        <SegmentedControl
          {...segmentedControlProps}
          value={currentView}
          onChange={(view) => confirmDiscard() && setCurrentView(view)}
          data={views}
        />
      </Group>

      {currentView === "Ranking" && <RankingPanel eventId={eventId} />}
      {currentView === "Technical Questions" && (
        <TechnicalQuestions eventId={eventId} />
      )}
    </Stack>
  );
};

export default RankingTab;
