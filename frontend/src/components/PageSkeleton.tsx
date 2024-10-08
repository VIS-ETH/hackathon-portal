import { skeletonProps } from "@/styles/common";

import { SimpleGrid, Skeleton, Stack } from "@mantine/core";

const PageSkeleton = () => {
  return (
    <Stack gap="xl">
      <Stack gap="sm">
        <Skeleton {...skeletonProps} height={35} maw={300} />
        <Skeleton {...skeletonProps} maw={500} />
      </Stack>
      <Stack gap="sm">
        <Skeleton {...skeletonProps} />
        <Skeleton {...skeletonProps} />
        <Skeleton {...skeletonProps} width="62%" />
      </Stack>
      <SimpleGrid cols={2}>
        <Skeleton {...skeletonProps} height={200} />
        <Skeleton {...skeletonProps} height={200} />
      </SimpleGrid>
    </Stack>
  );
};

export default PageSkeleton;
