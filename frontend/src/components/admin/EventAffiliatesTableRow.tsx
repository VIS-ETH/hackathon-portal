import { useDeleteEventRoles, usePutEventRoles } from "@/api/gen";
import { Event, EventAffiliate, EventRole } from "@/api/gen/schemas";

import { Checkbox, Table } from "@mantine/core";

type EventAffiliatesTableRowProps = {
  event: Event;
  affiliate: EventAffiliate;
  dangerous?: boolean;
  refetch?: () => void;
};

const EventAffiliatesTableRow = ({
  event,
  affiliate,
  dangerous,
  refetch,
}: EventAffiliatesTableRowProps) => {
  const putEventRolesMutation = usePutEventRoles();
  const deleteEventRolesMutation = useDeleteEventRoles();

  const handleUpdateRole = async (role: EventRole, checked: boolean) => {
    const data = {
      [affiliate.id]: [role],
    };

    const isAdmin = role === EventRole.Admin;
    const isLastRole = !checked && affiliate.roles.length === 1;

    if (!dangerous && (isAdmin || isLastRole)) {
      const dangerousReason = isAdmin
        ? "affects the admin role"
        : "would remove the last role of the affiliate";

      const confirmation = confirm(
        `Are you sure you want to ${
          checked ? "give to" : "remove from"
        } ${affiliate.name} the role ${role}?\n\nThis action is considered dangerous because it ${dangerousReason}.`,
      );

      if (!confirmation) {
        return;
      }
    }

    if (checked) {
      await putEventRolesMutation.mutateAsync({
        eventId: event.id,
        data,
      });
    } else {
      await deleteEventRolesMutation.mutateAsync({
        eventId: event.id,
        data,
      });
    }

    refetch?.();
  };

  return (
    <Table.Tr>
      <Table.Td>{affiliate.name}</Table.Td>
      {Object.values(EventRole).map((role) => (
        <Table.Td key={role}>
          <Checkbox
            checked={affiliate.roles.includes(role)}
            onChange={(e) => {
              handleUpdateRole(role, e.currentTarget.checked);
            }}
          />
        </Table.Td>
      ))}
    </Table.Tr>
  );
};

export default EventAffiliatesTableRow;
