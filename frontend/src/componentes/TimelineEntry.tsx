import UpdateAppointment from "./TimelineEntryEdit";

import { Appointment } from "@/api/gen";

import { useState } from "react";
import {
  FormattedDate,
  FormattedDateTimeRange,
  FormattedTime,
} from "react-intl";

import {
  Accordion,
  ActionIcon,
  Button,
  Collapse,
  Flex,
  Group,
  Modal,
  Stack,
  Text,
  Timeline,
  Title,
} from "@mantine/core";

import { useListState } from "@mantine/hooks";

import { IconCaretDown, IconCaretUp } from "@tabler/icons-react";

type Props = {
  item: Appointment;
  edit?: boolean;
  refetch?: () => void;
  index: number;
};

export default function TimelineEntry({
  index,
  item,
  edit = false,
  refetch,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Stack>
      <Flex align={"center"} gap={"md"} justify={"left"}>
        <Title order={3}>{item.title}</Title>
        {item.content && (
          <Button
            leftSection={open ? <IconCaretUp /> : <IconCaretDown />}
            variant="outline"
            onClick={() => setOpen(!open)}
          >
            {open ? "Close" : "Details"}
          </Button>
        )}
        {edit && refetch && (
          <UpdateAppointment appointment={item} refetch={refetch} />
        )}
      </Flex>
      <Text c="dimmed" size="sm">
        {item.description}
      </Text>
      <Text size="xs" mt={4}>
        {item.end ? (
          <FormattedDateTimeRange
            from={new Date(item.start)}
            to={new Date(item.end)}
            dateStyle="short"
            timeStyle="short"
          />
        ) : (
          <FormattedDate value={item.start} dateStyle="short" />
        )}
      </Text>
      {item.content && (
        <>
          <Collapse in={open}>
            <Text c="dimmed" size="sm">
              {item.content}
            </Text>
          </Collapse>
        </>
      )}
    </Stack>
  );
}
