import CreateSidequestDrawer from "./CreateSidequestDrawer";
import SidequestCard from "./SidequestCard";

import { useGetSidequests } from "@/api/gen";
import { Event } from "@/api/gen/schemas";
import { iconProps, secondaryButtonProps } from "@/styles/common";

import { Button, Group, Stack } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconPlus } from "@tabler/icons-react";

type SidequestsListProps = {
  event: Event;
  manage?: boolean;
};

const SidequestsList = ({ event, manage }: SidequestsListProps) => {
  const [opened, handles] = useDisclosure();
  const { data: sidequests, refetch: refetchSidequests } = useGetSidequests({
    event_id: event.id,
  });

  return (
    <>
      <Stack>
        <Group justify="end">
          {manage && (
            <Button
              {...secondaryButtonProps}
              leftSection={<IconPlus {...iconProps} />}
              onClick={handles.open}
            >
              Create
            </Button>
          )}
        </Group>
        {sidequests?.map((sidequest) => (
          <SidequestCard key={sidequest.id} sidequest={sidequest} />
        ))}
      </Stack>
      <CreateSidequestDrawer
        eventId={event.id}
        opened={opened}
        onClose={handles.close}
        refetch={refetchSidequests}
      />
    </>
  );
};

export default SidequestsList;
