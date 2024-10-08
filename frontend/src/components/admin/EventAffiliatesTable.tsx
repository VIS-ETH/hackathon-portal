import IconTextGroup from "../IconTextGroup";
import NoEntriesTr from "../NoEntriesTr";
import EventAffiliatesTableRow from "./EventAffiliatesTableRow";

import { useGetEventAffiliates } from "@/api/gen";
import { Event, EventRole } from "@/api/gen/schemas";
import {
  cardProps,
  cardSectionProps,
  iconProps,
  secondaryButtonProps,
  segmentedControlProps,
} from "@/styles/common";

import { useState } from "react";

import {
  Button,
  Card,
  Checkbox,
  Group,
  SegmentedControl,
  Table,
  Text,
} from "@mantine/core";

import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import objectHash from "object-hash";

type EventAffiliatesTableProps = {
  event: Event;
};

const EventAffiliatesTable = ({ event }: EventAffiliatesTableProps) => {
  const [unsafe, setUnsafe] = useState(false);
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
    <Card {...cardProps}>
      <Card.Section {...cardSectionProps}>
        <IconTextGroup Icon={IconAlertTriangle} iconProps={{ color: "red" }} lg>
          <Text c="red" fw={600}>
            All changes are APPLIED IMMEDIATELY.
          </Text>
        </IconTextGroup>
      </Card.Section>
      <Card.Section {...cardSectionProps}>
        <Group>
          <Button
            {...secondaryButtonProps}
            size="sm"
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
              setRoleFilter(value === "All" ? undefined : (value as EventRole))
            }
          />
          <Checkbox
            checked={unsafe}
            onChange={(event) => setUnsafe(event.currentTarget.checked)}
            label="Accept unsafe changes"
          />
        </Group>
      </Card.Section>
      <Card.Section>
        <Table.ScrollContainer minWidth={750}>
          <Table striped layout="fixed">
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
                    key={objectHash(affiliate)}
                    event={event}
                    affiliate={affiliate}
                    unsafe={unsafe}
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
  );
};

export default EventAffiliatesTable;
