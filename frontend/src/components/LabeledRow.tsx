import { Fragment, ReactNode } from "react";

import { Box, Flex, Stack, Text } from "@mantine/core";

type LabeledRowProps = {
  label: ReactNode;
  description?: string | null;
  // the value or control, right-aligned
  children: ReactNode;
};

const LabeledRow = ({ label, description, children }: LabeledRowProps) => {
  const trimmedDescription = description?.trimEnd();

  return (
    <Flex direction={{ base: "column", sm: "row" }} gap="md">
      <Stack gap={0} flex={1}>
        <Text fw={600}>{label}</Text>
        {trimmedDescription && (
          <Text c="dimmed" size="sm">
            {trimmedDescription.split("\n").map((line, index) => (
              <Fragment key={index}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </Text>
        )}
      </Stack>
      <Box w={{ base: "100%", sm: 240 }} ta="right">
        {children}
      </Box>
    </Flex>
  );
};

export default LabeledRow;
