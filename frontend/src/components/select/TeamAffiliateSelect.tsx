import { useGetTeamAffiliates } from "@/api/gen";
import { TeamAffiliate, TeamRole } from "@/api/gen/schemas";
import { inputProps } from "@/styles/common";

import { Select, SelectProps } from "@mantine/core";

type TeamAffiliateSelectProps = SelectProps & {
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
  const { data: affiliates = [] } = useGetTeamAffiliates(teamId, {
    role,
  });

  return (
    <Select
      {...(inputProps as SelectProps)}
      {...additionalProps}
      data={affiliates.map((affiliate) => ({
        label: affiliate.name,
        value: affiliate.id,
      }))}
      value={affiliateId ?? null} // Mantine expects null and not undefined
      onChange={(value) => {
        if (value === null) {
          setAffiliate(undefined);
        } else {
          setAffiliate(affiliates.find((affiliate) => affiliate.id === value));
        }
      }}
      placeholder={`Select ${role?.toLowerCase() ?? "affiliate"}`}
      searchable
      clearable
    />
  );
};

export default TeamAffiliateSelect;
