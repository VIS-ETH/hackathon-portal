"use client";

import { useDeleteSidequest, useGetSidequests } from "@/api/gen";
import IconTextGroup from "@/components/IconTextGroup";
import MarkdownCard from "@/components/MarkdownCard";
import PageSkeleton from "@/components/PageSkeleton";
import SidequestLeaderboardTable from "@/components/sidequest/SidequestLeaderboardTable";
import UpdateSidequestDrawer from "@/components/sidequest/UpdateSidequestDrawer";
import { useResolveParams } from "@/hooks/useResolveParams";
import { iconProps, secondaryButtonProps } from "@/styles/common";

import { Button, Group, Stack, Text, Title } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import {
  IconArrowBarDown,
  IconArrowBarUp,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";

const Sidequest = () => {
  const router = useRouter();
  const [opened, handles] = useDisclosure();
  const { event, sidequest, refetchSidequest, policies } = useResolveParams();
  const { refetch: refetchSidequests } = useGetSidequests(
    { event_id: event?.id ?? "" },
    {
      query: {
        enabled: !!event,
      },
    },
  );

  const deleteSidequestMutation = useDeleteSidequest();

  if (!event || !sidequest || !policies) {
    return <PageSkeleton />;
  }

  const refetch = () => {
    refetchSidequest();
    refetchSidequests();
  };

  const handleDelete = async () => {
    const confirm = window.confirm(
      `Are you sure you want to delete "${sidequest.name}"?`,
    );

    if (!confirm) {
      return;
    }

    await deleteSidequestMutation.mutateAsync({ sidequestId: sidequest.id });
    refetchSidequests();
    router.push(`/events/${event.slug}/sidequests`);
  };

  return (
    <>
      <Stack>
        <Group justify="space-between">
          <Title order={2}>{sidequest.name}</Title>
          {policies.can_manage_sidequest && (
            <Group gap="xs">
              <Button
                {...secondaryButtonProps}
                leftSection={<IconPencil {...iconProps} />}
                onClick={handles.open}
              >
                Update
              </Button>
              <Button
                {...secondaryButtonProps}
                leftSection={<IconTrash {...iconProps} />}
                color="red"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </Group>
          )}
        </Group>
        {sidequest.is_higher_result_better ? (
          <IconTextGroup Icon={IconArrowBarDown}>
            <Text>Higher result is better</Text>
          </IconTextGroup>
        ) : (
          <IconTextGroup Icon={IconArrowBarUp}>
            <Text>Lower result is better</Text>
          </IconTextGroup>
        )}
        <MarkdownCard content={sidequest.description} />
        <SidequestLeaderboardTable sidequest={sidequest} />
      </Stack>
      <UpdateSidequestDrawer
        sidequest={sidequest}
        opened={opened}
        onClose={handles.close}
        refetch={refetch}
      />
    </>
  );
};

export default Sidequest;
