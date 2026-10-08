import { inputProps } from "@/styles/common";

import { useMemo } from "react";

import { Select, SelectProps } from "@mantine/core";

type EntitySelectProps<T extends { id: string; name: string }> = Omit<
  SelectProps,
  "data" | "value" | "onChange" | "searchable" | "clearable"
> & {
  entities?: T[];
  entityId?: string;
  setEntity: (entity: T | undefined) => void;
};

const EntitySelect = <T extends { id: string; name: string }>({
  entities,
  entityId,
  setEntity,
  ...additionalProps
}: EntitySelectProps<T>) => {
  const options = useMemo(
    () =>
      (entities ?? []).map((entity) => ({
        label: entity.name,
        value: entity.id,
      })),
    [entities],
  );

  return (
    <Select
      {...inputProps}
      comboboxProps={{ keepMounted: false }}
      {...additionalProps}
      data={options}
      value={entityId ?? null} // Mantine expects null and not undefined
      onChange={(value) => {
        if (value === null) {
          setEntity(undefined);
        } else {
          setEntity(entities?.find((entity) => entity.id === value));
        }
      }}
      searchable
      clearable
    />
  );
};

export default EntitySelect;
