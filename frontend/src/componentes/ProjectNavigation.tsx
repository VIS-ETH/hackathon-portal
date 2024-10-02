import { Project, useGetEventRoles } from "@/api/gen";

import { Button, Flex, Group, Select, Title } from "@mantine/core";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type ProjectNaviationProps = {
  projects: Project[];
  event_id: string;
  current_project: Project | null;
};

const ProjectNavigator = ({
  projects,
  event_id,
  current_project,
}: ProjectNaviationProps) => {
  const { eventSlug, projectSlug } = useParams<{
    eventSlug: string;
    projectSlug: string;
  }>();

  const { data: roles } = useGetEventRoles(event_id);
  const router = useRouter();

  return (
    <Flex justify={"space-between"} gap={"md"}>
      <Title order={2}>
        {current_project ? current_project.name : "Projects"}
      </Title>
      <Group>
        {roles?.includes("Admin") && (
          <>
            {current_project && (
              <Link
                href={`/${eventSlug}/participant/projects/${projectSlug}/edit`}
              >
                <Button>Edit</Button>
              </Link>
            )}
            <Link href={`/${eventSlug}/participant/projects/create`}>
              <Button>Create</Button>
            </Link>
          </>
        )}
        <Select
          data={projects?.map((item) => item.slug) || []}
          value={current_project?.slug}
          placeholder="Select Project"
          onChange={(value) =>
            router.push(`/${eventSlug}/participant/projects/${value}`)
          }
        />
      </Group>
    </Flex>
  );
};

export default ProjectNavigator;
