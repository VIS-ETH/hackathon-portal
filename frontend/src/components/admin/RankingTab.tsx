import TechnicalQuestionList from "../technicalQuestions/TechnicalQuestionList";

import ScrollableSegmentedControl from "@/components/ScrollableSegmentedControl";
import RankingPanel from "@/components/admin/RankingPanel";
import { confirmDiscard } from "@/hooks/useUnsavedChanges";

import { useState } from "react";

import { Group, Stack } from "@mantine/core";

type RankingTabProps = {
  eventId: string;
};

const RankingTab = ({ eventId }: RankingTabProps) => {
  const views = ["Ranking", "Technical Questions"];
  const [currentView, setCurrentView] = useState("Ranking");

  return (
    <Stack>
      <Group>
        <ScrollableSegmentedControl
          value={currentView}
          onChange={(view) => confirmDiscard() && setCurrentView(view)}
          data={views}
        />
      </Group>

      {currentView === "Ranking" && <RankingPanel eventId={eventId} />}
      {currentView === "Technical Questions" && (
        <TechnicalQuestionList eventId={eventId} />
      )}
    </Stack>
  );
};

export default RankingTab;
