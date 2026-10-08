import NoEntriesTr from "../NoEntriesTr";
import EventAffiliatesTableRow from "./EventAffiliatesTableRow";
import InvitationControls from "./InvitationControls";

import { useGetEventAffiliates } from "@/api/gen";
import { Event, EventRole } from "@/api/gen/schemas";
import {
  alertProps,
  cardProps,
  cardSectionProps,
  iconProps,
  largeIconProps,
  segmentedControlProps,
  toolbarButtonProps,
} from "@/styles/common";

import { useState } from "react";

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Group,
  SegmentedControl,
  Stack,
  Table,
  Text,
} from "@mantine/core";

import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";

type EventAffiliatesTableProps = {
  event: Event;
};

const EventAffiliatesTable = ({ event }: EventAffiliatesTableProps) => {
  const [dangerous, setDangerous] = useState(false);
  const [roleFilter, setRoleFilter] = useState<EventRole | undefined>();

  const { data: affiliates = [], refetch: refetchAffiliates } =
    useGetEventAffiliates(event.id);

  const filteredAffiliates = affiliates.filter(
    (affiliate) => !roleFilter || affiliate.roles.includes(roleFilter),
  );

  const roleFilterValue = roleFilter ?? "All";
  const roleFilterTabs = ["All", ...Object.values(EventRole)].map((role) => {
    if (role === roleFilterValue) {
      return {
        label: `${role} (${filteredAffiliates.length})`,
        value: role,
      };
    } else {
      return {
        label: role,
        value: role,
      };
    }
  });

  return (
    <Stack>
      <Alert
        {...alertProps}
        icon={<IconAlertCircle {...largeIconProps} />}
        color="red"
        title="Role changes apply immediately"
      >
        <Text>
          Ticking or unticking a role saves it right away. Giving or taking the
          admin role and removing someone&apos;s last role ask for confirmation
          first, unless <strong>Accept dangerous changes</strong> is ticked.
        </Text>
      </Alert>
      <InvitationControls event={event} onInvite={refetchAffiliates} />
      <Card {...cardProps}>
        <Card.Section {...cardSectionProps}>
          <Group>
            <Button
              {...toolbarButtonProps}
              leftSection={<IconRefresh {...iconProps} />}
              onClick={() => {
                refetchAffiliates();
              }}
            >
              Refresh
            </Button>
            <SegmentedControl
              {...segmentedControlProps}
              data={roleFilterTabs}
              value={roleFilterValue}
              onChange={(value) =>
                setRoleFilter(
                  value === "All" ? undefined : (value as EventRole),
                )
              }
            />
            <Checkbox
              checked={dangerous}
              onChange={(event) => setDangerous(event.currentTarget.checked)}
              label="Accept dangerous changes"
            />
          </Group>
        </Card.Section>
        <Card.Section>
          <Table.ScrollContainer minWidth={750}>
            <Table striped layout="fixed" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  {Object.values(EventRole).map((role) => (
                    <Table.Th key={role}>{role}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredAffiliates.length ? (
                  filteredAffiliates.map((affiliate) => (
                    <EventAffiliatesTableRow
                      key={affiliate.id}
                      event={event}
                      affiliate={affiliate}
                      dangerous={dangerous}
                      refetch={refetchAffiliates}
                    />
                  ))
                ) : (
                  <NoEntriesTr colSpan={Object.values(EventRole).length + 1} />
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card.Section>
      </Card>
    </Stack>
  );
};

export default EventAffiliatesTable;
