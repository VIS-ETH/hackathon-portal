import FeedbackCard from "./FeedbackCard";

import { TeamRanking } from "@/api/gen/schemas";
import { podiumPlaces } from "@/styles/common";

import { Group, Text } from "@mantine/core";

import { IconTrophy } from "@tabler/icons-react";

type PublicFeedbackProps = {
  entry: TeamRanking;
};

const PublicFeedback = ({ entry }: PublicFeedbackProps) => {
  return (
    <FeedbackCard
      title="Public Ranking"
      category={entry.public}
      rows={[
        {
          key: "votes",
          content: (
            <Group justify="space-between">
              {podiumPlaces.map(({ place, title, color }) => (
                <Group key={place}>
                  <IconTrophy size={20} color={color} />
                  <Text fw={600} size="lg">
                    {entry.public.votes[place] || 0}
                  </Text>
                  <Text c="dimmed" size="sm">
                    {title.toLowerCase()} votes
                  </Text>
                </Group>
              ))}
            </Group>
          ),
        },
      ]}
    />
  );
};

export default PublicFeedback;
