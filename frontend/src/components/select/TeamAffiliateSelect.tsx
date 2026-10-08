import EntitySelect from "./EntitySelect";

import { useGetTeamAffiliates } from "@/api/gen";
import { TeamAffiliate, TeamRole } from "@/api/gen/schemas";

import { SelectProps } from "@mantine/core";

type TeamAffiliateSelectProps = Omit<
  SelectProps,
  "data" | "value" | "onChange" | "placeholder" | "searchable" | "clearable"
> & {
  teamId: string;
  affiliateId?: string;
  setAffiliate: (affiliate: TeamAffiliate | undefined) => void;
  role?: TeamRole;
};

const TeamAffiliateSelect = ({
  teamId,
  affiliateId,
  setAffiliate,
  role,
  ...additionalProps
}: TeamAffiliateSelectProps) => {
  const { data: affiliates } = useGetTeamAffiliates(teamId, {
    role,
  });

  return (
    <EntitySelect
      {...additionalProps}
      entities={affiliates}
      entityId={affiliateId}
      setEntity={setAffiliate}
      placeholder={`Select ${role?.toLowerCase() ?? "affiliate"}`}
    />
  );
};

export default TeamAffiliateSelect;
