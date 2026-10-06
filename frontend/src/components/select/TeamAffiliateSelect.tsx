import { useGetTeamAffiliates } from "@/api/gen";
import { TeamAffiliate, TeamRole } from "@/api/gen/schemas";
import { inputProps } from "@/styles/common";

import { useMemo } from "react";

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
  const { data: affiliates } = useGetTeamAffiliates(teamId, {
    role,
  });

  const options = useMemo(
    () =>
      (affiliates ?? []).map((affiliate) => ({
        label: affiliate.name,
        value: affiliate.id,
      })),
    [affiliates],
  );

  return (
    <Select
      {...(inputProps as SelectProps)}
      comboboxProps={{ keepMounted: false }}
      {...additionalProps}
      data={options}
      value={affiliateId ?? null} // Mantine expects null and not undefined
      onChange={(value) => {
        if (value === null) {
          setAffiliate(undefined);
        } else {
          setAffiliate(affiliates?.find((affiliate) => affiliate.id === value));
        }
      }}
      placeholder={`Select ${role?.toLowerCase() ?? "affiliate"}`}
      searchable
      clearable
    />
  );
};

export default TeamAffiliateSelect;
