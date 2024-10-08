import BadgeArrayItem, { IdName } from "./BadgeArrayItem";


import { Stack } from "@mantine/core";


type BadgeArrayProps = {
  data?: IdName[];
  indexed?: boolean;
};

const BadgeArray = ({ data = [], indexed }: BadgeArrayProps) => {
  return (
    <Stack gap={2}>
      {data.map((item, index) => (
        <BadgeArrayItem
          key={item.id}
          item={item}
          index={index}
          indexed={indexed}
        />
      ))}
    </Stack>
  );
};

export default BadgeArray;
