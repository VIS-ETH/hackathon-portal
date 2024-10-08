import { useCreateTeam } from "@/api/gen";
import { cardProps, primaryButtonProps } from "@/styles/common";

import { Button, Card, Center, SimpleGrid, Stack, Text } from "@mantine/core";

import { faker } from "@faker-js/faker";

type CreateTeamProps = {
  eventId: string;
  refetch?: () => void;
};

const CreateTeamCard = ({ eventId, refetch }: CreateTeamProps) => {
  const createTeamMutations = useCreateTeam();

  const handleCreate = async () => {
    const name = `${faker.color.human()} ${faker.animal.type()}`;

    const data = {
      event_id: eventId,
      name: name,
    };

    await createTeamMutations.mutateAsync({
      data,
    });

    refetch?.();
  };

  return (
    <Card {...cardProps} ta="center">
      <SimpleGrid cols={{ xs: 1, sm: 2 }} p="xl" spacing="xl">
        <Center>
          <Stack gap="lg">
            <Text>
              You don&apos;t seem to be part of any team yet. If you already
              have a group, you can ask your partners to invite you.
            </Text>
            <Text>Otherwise, you can create a new team.</Text>
          </Stack>
        </Center>
        <Center>
          <Button {...primaryButtonProps} onClick={handleCreate}>
            Create Team
          </Button>
        </Center>
      </SimpleGrid>
    </Card>
  );
};

export default CreateTeamCard;
