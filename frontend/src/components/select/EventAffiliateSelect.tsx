import EntitySelect from "./EntitySelect";

import { useGetEventAffiliates } from "@/api/gen";
import { EventAffiliate, EventRole } from "@/api/gen/schemas";

import { SelectProps } from "@mantine/core";

type EventAffiliateSelectProps = Omit<
  SelectProps,
  "data" | "value" | "onChange" | "placeholder" | "searchable" | "clearable"
> & {
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
  const { data: affiliates } = useGetEventAffiliates(eventId, {
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

export default EventAffiliateSelect;
