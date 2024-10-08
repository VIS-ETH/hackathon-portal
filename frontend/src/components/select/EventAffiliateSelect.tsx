import { useGetEventAffiliates } from "@/api/gen";
import { EventAffiliate, EventRole } from "@/api/gen/schemas";
import { inputProps } from "@/styles/common";

import { Select, SelectProps } from "@mantine/core";

type EventAffiliateSelectProps = SelectProps & {
  eventId: string;
  affiliateId?: string;
  setAffiliate: (affiliate: EventAffiliate | undefined) => void;
  role?: EventRole;
};

const EventAffiliateSelect = ({
  eventId,
  affiliateId,
  setAffiliate,
  role,
  ...additionalProps
}: EventAffiliateSelectProps) => {
  const { data: affiliates = [] } = useGetEventAffiliates(eventId, {
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

export default EventAffiliateSelect;
