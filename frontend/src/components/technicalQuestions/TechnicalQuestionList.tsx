import TechnicalQuestionEntry from "./TechnicalQuestionEntry";

import { useGetTechnicalQuestions } from "@/api/gen";

import React, { useState } from "react";

import {
  Box,
  Button,
  Center,
  Group,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";

import { IconRefresh } from "@tabler/icons-react";

type TechnicalQuestionListProps = { eventId: string };

const TechnicalQuestionList = ({ eventId }: TechnicalQuestionListProps) => {
  const { data: questions = [], refetch: refetchQuestions } =
    useGetTechnicalQuestions(eventId);
  const [editMode, setEditMode] = useState(false);

  return (
    <Box>
      <Group justify="flex-end" py="sm" w={"100%"}>
        <Button
          leftSection={<IconRefresh />}
          onClick={() => refetchQuestions()}
        >
          Refresh
        </Button>
        <Switch
          label="Edit Mode"
          checked={editMode}
          onChange={(e) => setEditMode(e.currentTarget.checked)}
        />
      </Group>

      <Stack>
        {questions.length === 0 && (
          <Center>
            <Text c="dimmed">
              No technical questions found. Add one using the form below.
            </Text>
          </Center>
        )}

        {questions.map((q) => (
          <TechnicalQuestionEntry
            key={q.id}
            q={q}
            eventId={eventId}
            mode={editMode ? "edit" : "view"}
          />
        ))}
        <Title order={3}>Create New Question</Title>

        <TechnicalQuestionEntry eventId={eventId} mode="create" />
      </Stack>
    </Box>
  );
};

export default TechnicalQuestionList;
