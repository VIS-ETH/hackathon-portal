import IconTextGroup from "../IconTextGroup";

import { Cooldown } from "@/api/gen/schemas";

import { FormattedDate } from "react-intl";

import { Text } from "@mantine/core";

import { IconCheck, IconX } from "@tabler/icons-react";

type CooldownTextProps = {
  cooldown: Cooldown;
};

const CooldownText = ({ cooldown }: CooldownTextProps) => {
  return cooldown.next_attempt ? (
    <IconTextGroup Icon={IconX} iconProps={{ color: "red" }}>
      <Text c="red">
        Next attempt allowed at{" "}
        <FormattedDate value={`${cooldown.next_attempt}Z`} timeStyle="short" />
      </Text>
    </IconTextGroup>
  ) : (
    <IconTextGroup Icon={IconCheck} iconProps={{ color: "green" }}>
      <Text c="green">Attempt allowed now</Text>
    </IconTextGroup>
  );
};

export default CooldownText;
