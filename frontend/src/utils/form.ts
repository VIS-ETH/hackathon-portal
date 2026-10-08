import { UseFormReturnType } from "@mantine/form";

import dayjs from "dayjs";

type FormStatus<Values> = Pick<
  UseFormReturnType<Values>,
  "getValues" | "isDirty"
>;

// The fields whose values differ from the form's initial values. Initial values
// must have the format the inputs emit (e.g. "" instead of null, dates via
// fromUtcDate), otherwise an untouched field counts as modified.
export const modifiedFields = <Values extends object>(
  form: FormStatus<Values>,
) =>
  (Object.keys(form.getValues()) as (keyof Values & string)[]).filter((path) =>
    form.isDirty(path),
  );

export const modifiedValues = <Values extends object>(
  form: FormStatus<Values>,
  values: Values,
): Partial<Values> =>
  Object.fromEntries(
    modifiedFields(form).map((path) => [path, values[path]]),
  ) as Partial<Values>;

// Backend timestamps are naive UTC; the date pickers use local time strings.
export const fromUtcDate = (value: string) =>
  dayjs(`${value}Z`).format("YYYY-MM-DD HH:mm:ss");

export const toUtcDate = (value: string) =>
  dayjs(value).toISOString().replace("Z", "");
