"use client";

import {
  DeleteTeamRolesMutation,
  DeleteTeamRolesMutationRequest,
  Project,
  PutTeamRolesMutationRequest,
  Team,
  TeamRole,
  useDeleteTeam,
  useDeleteTeamRoles,
  useGetEvent,
  useGetProjects,
  useGetTeam,
  useGetTeamAffiliates,
  useGetTeamProjectPreferences,
  usePutTeamRoles,
  useUpdateTeamProjectPreferences,
} from "@/api/gen";

import { useEffect, useState } from "react";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { useDisclosure, useListState } from "@mantine/hooks";

import {
  IconNumber1,
  IconNumber2,
  IconNumber3,
  IconPlus,
} from "@tabler/icons-react";
import { randomUUID } from "crypto";
import { useParams, useRouter } from "next/navigation";

const PrioEntry = ({
  index,
  project_id,
  projects,
  update,
}: {
  index: number;
  project_id: string | null;
  projects: Project[];
  update: (value: string | null) => void;
}) => {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const event_id = "fae4d7ff-ee08-4e16-8802-a1b1797145d5";
  const { data: event } = useGetEvent(event_id);

  const possible_projects = projects.map((project) => {
    return { value: project.id, label: project.name };
  });
  const placeholder =
    index == 1
      ? "First Priority"
      : index == 2
        ? "Second Priority"
        : "Third Priority";

  const icon =
    index == 1 ? (
      <IconNumber1 />
    ) : index == 2 ? (
      <IconNumber2 />
    ) : (
      <IconNumber3 />
    );
  return (
    <Select
      maw={400}
      placeholder={placeholder}
      data={possible_projects}
      leftSection={icon}
      clearable
      value={project_id}
      disabled={event?.phase != "Registration"}
      onChange={(value) => {
        update(value);
      }}
    />
  );
};

const ProjectInfo = ({ team }: { team: Team }) => {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const event_id = "fae4d7ff-ee08-4e16-8802-a1b1797145d5";

  const { data: project } = useGetProjects({ event_id: event_id });
  const { data: project_pref } = useGetTeamProjectPreferences(team.id);
  const set_priorities = useUpdateTeamProjectPreferences(team.id);

  const [prio, setPrio] = useListState<string | null>([null, null, null]);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (project_pref) {
      setPrio.setState([
        project_pref.project_preferences[0],
        project_pref.project_preferences[1],
        project_pref.project_preferences[2],
      ]);
    }
  }, [project_pref]);

  useEffect(() => {
    if (!project_pref) return;
    if (
      project_pref.project_preferences[0] != prio[0] ||
      project_pref.project_preferences[1] != prio[1] ||
      project_pref.project_preferences[2] != prio[2]
    ) {
      setChanged(true);
    }
  }, [prio]);

  const update = () => {
    if (!changed) return;

    if (prio[0] == null || prio[1] == null || prio[2] == null) {
      return;
    }

    set_priorities.mutate(
      { project_preferences: [prio[0], prio[1], prio[2]] },
      {
        onSuccess: () => {},
        onError: (error) => {},
      },
    );
    setChanged(false);
  };

  return (
    <>
      <Stack>
        <Title order={3}>Your Priorities</Title>
        <PrioEntry
          index={1}
          project_id={prio[0]}
          projects={project || []}
          update={(value) => setPrio.setItem(0, value)}
        />
        <PrioEntry
          index={2}
          project_id={prio[1]}
          projects={project || []}
          update={(value) => setPrio.setItem(1, value)}
        />
        <PrioEntry
          index={3}
          project_id={prio[2]}
          projects={project || []}
          update={(value) => setPrio.setItem(2, value)}
        />
        <Button disabled={!changed} maw={400} onClick={update}>
          Update
        </Button>
      </Stack>
    </>
  );
};

const AddAffiliate = ({
  team,
  refetch,
}: {
  team: Team;
  refetch: () => void;
}) => {
  const add_query = usePutTeamRoles(team.id);

  const users = [
    { value: "42305392-ca9c-4285-8dd5-875c4ebd1512", label: "hannes" },
    { value: "60c91a5e-0c18-49f9-a8c6-4a6d260f20ca", label: "Ramon" },
    { value: "a5740db5-a333-4db4-a18c-27aaffcb95a4", label: "Alice" },
    { value: "1c41137a-dfdc-4d71-a612-3e1d51174283", label: "Bob" },
    { value: "b328f1f6-017d-4e36-844d-0317e9e69a06", label: "Charlie" },
    { value: "fd0117fd-3363-430a-8a83-45a51dcf731c", label: "Diana" },
    { value: "55546cda-abcc-4a93-a43e-6caa9659449e", label: "Eve" },
    { value: "1488a196-003a-49d3-b86a-1c1b573c49f1", label: "Frank" },
    { value: "d7350062-ef2d-4c82-b730-88118f462a8c", label: "Grace" },
    { value: "597336a5-7b06-47b8-8993-7aa2c240900a", label: "Hank" },
    { value: "32ebcdae-b1a4-4852-814a-7c98e141fd39", label: "Ivy" },
    { value: "bb9ef65d-ab6d-4d0c-90ec-bfea627a0570", label: "Jack" },
  ];

  const [value, setValue] = useState<string | null>(null);

  const add = () => {
    if (value == null) {
      return;
    }

    // add user to team
    // const data = new Map<string, TeamRole[]>();
    const data: PutTeamRolesMutationRequest = {
      // value : ["Member"]
    };
    data[value] = ["Member"];
    // const data = {value: ["Member"]} as PutTeamRolesMutationRequest;
    // data.set(value, ["Member"]);
    console.log(data);
    add_query.mutate(data, {
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {},
    });
    refetch();
  };

  return (
    <>
      <Group gap={"xs"}>
        <Select
          data={users}
          value={value}
          onChange={(value) => setValue(value)}
          placeholder="Add Team Member"
          searchable
        />
        <ActionIcon onClick={add}>
          <IconPlus />
        </ActionIcon>
      </Group>
    </>
  );
};

const AffiliatesInfo = ({
  team,
  refetch_team,
}: {
  team: Team;
  refetch_team: () => void;
}) => {
  const { data: affiliates, refetch: refetch_affiliates } =
    useGetTeamAffiliates(team.id);

  const members = affiliates?.filter((affiliate) =>
    affiliate.roles.includes("Member"),
  );
  const mentors = affiliates?.filter((affiliate) =>
    affiliate.roles.includes("Mentor"),
  );

  // const { data: my_r}
  const my_uuid = "42305392-ca9c-4285-8dd5-875c4ebd1512";

  const delete_role_query = useDeleteTeamRoles(team.id);
  const delete_team_query = useDeleteTeam(team.id);

  const delete_me = () => {
    const data: DeleteTeamRolesMutationRequest = {};
    data[my_uuid] = ["Member"];
    delete_role_query.mutate(data, {
      onSuccess: () => {
        refetch_team();
      },
      onError: (error) => {},
    });
  };

  const delete_team = () => {
    delete_team_query.mutate(null as never, {
      onSuccess: () => {
        refetch_team();
      },
      onError: (error) => {},
    });
  };

  return (
    <>
      <Flex gap={"md"} align={"center"} justify={"space-between"}>
        <Group>
          <Title order={3}>Your Team : {team.name}</Title>
        </Group>
        <Group>
          <AddAffiliate team={team} refetch={refetch_affiliates} />
          <Button.Group>
            <Button onClick={delete_me}>Leave Team</Button>
            <Button color={"red"} onClick={delete_team}>
              Delete Team
            </Button>
          </Button.Group>
        </Group>
      </Flex>
      {mentors &&
        mentors.length > 0 &&
        mentors.map((mentor) => (
          <Group>
            <Text>{mentor.name}</Text>
            <Badge variant="filled">Mentor</Badge>
          </Group>
        ))}
      {members &&
        members.length > 0 &&
        members.map((member) => <Text>{member.name}</Text>)}
    </>
  );
};

export default function Page() {
  const { eventSlug } = useParams<{
    eventSlug: string;
  }>();

  const my_team_id = "532f5505-90ae-43e9-aae3-a6c3e694210b";

  const { data: team } = useGetTeam(my_team_id);

  const get_my_team = () => {};

  if (!team) {
    return <Text>Team not found</Text>;
  }

  return (
    <Stack gap="md">
      <ProjectInfo team={team} />
      <Divider />
      <AffiliatesInfo team={team} refetch_team={get_my_team} />
    </Stack>
  );
}
