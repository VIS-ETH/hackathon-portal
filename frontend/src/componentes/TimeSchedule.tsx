import { Button, Modal, Text, Timeline } from "@mantine/core";

import { useListState } from "@mantine/hooks";

interface TimeLineItem {
  title: string;
  shortDescription: string;
  longDescription?: string;
  at: Date;
  until?: Date;
}

type Props = {
  items: TimeLineItem[];
};

export default function TimeSchedule({ items }: Readonly<Props>) {
  const [isOpen, setIsOpen] = useListState(items.map(() => false));

  const activeIndex = items.reduce((acc, item, index) => {
    if (item.at < new Date()) {
      return index;
    }
    return acc;
  }, -1);

  return (
    <Timeline active={activeIndex} bulletSize={24} lineWidth={4}>
      {items.map((item, index) => (
        <Timeline.Item key={index} title={item.title}>
          <Text c="dimmed" size="sm">
            {item.shortDescription}
          </Text>
          <Text size="xs" mt={4}>
            {item.at.toLocaleString()}{" "}
            {item.until && " - " + item.until.toLocaleString()}
          </Text>
          {item.longDescription && (
            <>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsOpen.setItem(index, true)}
              >
                MORE
              </Button>
              <Modal
                size="auto"
                title={"Event: " + item.title}
                opened={isOpen[index]}
                onClose={() => setIsOpen.setItem(index, false)}
              >
                <Text>{item.longDescription}</Text>
              </Modal>
            </>
          )}
        </Timeline.Item>
      ))}
    </Timeline>
  );
}
