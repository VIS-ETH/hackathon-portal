import {
  useDeleteTeamRoles,
  useGetTeamAffiliates,
  usePutTeamRoles,
} from "@/api/gen";
import {
  AdminTeam,
  DeleteTeamRolesBody,
  EventAffiliate,
  EventRole,
  PutTeamRolesBody,
  TeamRole,
} from "@/api/gen/schemas";
import EventAffiliateSelect from "@/components/select/EventAffiliateSelect";
import { resizeArray } from "@/utils";

import { Table } from "@mantine/core";

type AffiliateTdsProps = {
  team: AdminTeam;
  role: TeamRole;
  max: number;
};

const AffiliateTds = ({ team, role, max }: AffiliateTdsProps) => {
  const { data: rawAffiliates = [], refetch: refetchAffiliates } =
    useGetTeamAffiliates(team.id);

  const putTeamRolesMutation = usePutTeamRoles();
  const deleteTeamRolesMutation = useDeleteTeamRoles();

  const affiliates = resizeArray(
    rawAffiliates.filter((affiliate) => affiliate.roles.includes(role)),
    max,
  );

  const handleUpdate = async (
    affiliate: EventAffiliate | undefined,
    index: number,
  ) => {
    const oldIds = affiliates
      .map((old) => old?.id)
      .filter((oldId) => oldId) as string[];

    const rawNewIds = affiliates
      .map((old, i) => (i === index ? affiliate?.id : old?.id))
      .filter((newId) => newId) as string[];

    const newIds = Array.from(new Set(rawNewIds));

    const idsToAdd = newIds.filter((newId) => !oldIds.includes(newId));
    const idsToRemove = oldIds.filter((oldId) => !newIds.includes(oldId));

    if (idsToAdd.length) {
      const putBody: PutTeamRolesBody = {};

      for (const id of idsToAdd) {
        if (id) {
          putBody[id] = [role];
        }
      }

      await putTeamRolesMutation.mutateAsync({
        teamId: team.id,
        data: putBody,
      });
    }

    if (idsToRemove.length) {
      const deleteBody: DeleteTeamRolesBody = {};

      for (const id of idsToRemove) {
        deleteBody[id] = [role];
      }

      await deleteTeamRolesMutation.mutateAsync({
        teamId: team.id,
        data: deleteBody,
      });
    }

    if (idsToAdd.length || idsToRemove.length) {
      refetchAffiliates();
    }
  };

  return affiliates.map((affiliate, index) => (
    <Table.Td key={`${affiliate?.id} ${index}`}>
      <EventAffiliateSelect
        eventId={team.event_id}
        affiliateId={affiliate?.id}
        setAffiliate={(mentor) => {
          handleUpdate(mentor, index);
        }}
        role={
          role === TeamRole.Member ? EventRole.Participant : EventRole.Mentor
        }
        size="xs"
      />
    </Table.Td>
  ));
};

export default AffiliateTds;
