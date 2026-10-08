import EntitySelect from "./EntitySelect";

import { useGetSidequests } from "@/api/gen";
import { Sidequest } from "@/api/gen/schemas";

import { SelectProps } from "@mantine/core";

type SidequestSelectProps = Omit<
  SelectProps,
  "data" | "value" | "onChange" | "placeholder" | "searchable" | "clearable"
> & {
  eventId: string;
  sidequestId?: string;
  setSidequest: (sidequest: Sidequest | undefined) => void;
};

const SidequestSelect = ({
  eventId,
  sidequestId,
  setSidequest,
  ...additionalProps
}: SidequestSelectProps) => {
  const { data: sidequests } = useGetSidequests({
    event_id: eventId,
  });

  return (
    <EntitySelect
      {...additionalProps}
      entities={sidequests}
      entityId={sidequestId}
      setEntity={setSidequest}
      placeholder="Select sidequest"
    />
  );
};

export default SidequestSelect;
