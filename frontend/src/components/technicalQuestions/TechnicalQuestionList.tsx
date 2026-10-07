import CardHeader from "../CardHeader";
import TechnicalQuestionEntry from "./TechnicalQuestionEntry";

import { useGetTechnicalQuestions } from "@/api/gen";
import { confirmDiscardIf } from "@/hooks/useUnsavedChanges";
import {
  cardProps,
  cardSectionProps,
  iconProps,
  toolbarButtonProps,
} from "@/styles/common";

import { useRef, useState } from "react";

import { Button, Card, Group, Stack, Switch, Text } from "@mantine/core";

import { IconRefresh } from "@tabler/icons-react";

type TechnicalQuestionListProps = { eventId: string };

const TechnicalQuestionList = ({ eventId }: TechnicalQuestionListProps) => {
  const { data: questions = [], refetch: refetchQuestions } =
    useGetTechnicalQuestions(eventId);
  const [editMode, setEditMode] = useState(false);
  const questionsWithDrafts = useRef(new Set<string>());

  return (
    <Stack>
      <Card {...cardProps}>
        <CardHeader title="Technical Questions" />
        <Card.Section {...cardSectionProps}>
          <Group>
            <Button
              {...toolbarButtonProps}
              leftSection={<IconRefresh {...iconProps} />}
              onClick={() => refetchQuestions()}
            >
              Refresh
            </Button>
            <Switch
              label="Edit mode"
              checked={editMode}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                // leaving the edit mode unmounts the editors and their drafts
                if (
                  checked ||
                  confirmDiscardIf(questionsWithDrafts.current.size > 0)
                ) {
                  setEditMode(checked);
                }
              }}
            />
          </Group>
        </Card.Section>
        {questions.length === 0 && (
          <Card.Section {...cardSectionProps}>
            <Text c="dimmed">
              No technical questions found. Add one using the form below.
            </Text>
          </Card.Section>
        )}
        {questions.map((q) => (
          <Card.Section key={q.id} {...cardSectionProps}>
            <TechnicalQuestionEntry
              technicalQuestion={q}
              eventId={eventId}
              mode={editMode ? "edit" : "view"}
              onUnsavedChange={(unsaved) => {
                if (unsaved) questionsWithDrafts.current.add(q.id);
                else questionsWithDrafts.current.delete(q.id);
              }}
            />
          </Card.Section>
        ))}
      </Card>

      <Card {...cardProps}>
        <CardHeader title="New Question" />
        <Card.Section {...cardSectionProps}>
          <TechnicalQuestionEntry eventId={eventId} mode="create" />
        </Card.Section>
      </Card>
    </Stack>
  );
};

export default TechnicalQuestionList;
