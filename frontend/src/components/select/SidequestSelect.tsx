import { useGetSidequests } from "@/api/gen";
import { Sidequest } from "@/api/gen/schemas";
import { inputProps } from "@/styles/common";

import { useMemo } from "react";

import { Select, SelectProps } from "@mantine/core";

type SidequestSelectProps = SelectProps & {
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

  const options = useMemo(
    () =>
      (sidequests ?? []).map((sidequest) => ({
        label: sidequest.name,
        value: sidequest.id,
      })),
    [sidequests],
  );

  return (
    <Select
      {...(inputProps as SelectProps)}
      comboboxProps={{ keepMounted: false }}
      {...additionalProps}
      data={options}
      value={sidequestId ?? null} // Mantine expects null and not undefined
      onChange={(value) => {
        if (value === null) {
          setSidequest(undefined);
        } else {
          setSidequest(sidequests?.find((sidequest) => sidequest.id === value));
        }
      }}
      placeholder={`Select sidequest`}
      searchable
      clearable
    />
  );
};

export default SidequestSelect;
