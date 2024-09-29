import {
  GetParticipantsWithSidequestInfoQueryResponse,
  SidequestDto,
  UserWithSidequestInfo,
  useGetEventRoles,
  useGetParticipantsWithSidequestInfo,
  useGetSidequests,
  usePostSidequestsAttempts,
} from "@/api/gen";
import { local_from_date, local_from_string } from "@/utils/time";

import { Dispatch, SetStateAction, useState } from "react";

import {
  ActionIcon,
  Box,
  Button,
  Card,
  Center,
  Flex,
  Group,
  Input,
  NumberInput,
  RingProgress,
  Select,
  Stack,
  Stepper,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";

import {
  IconCheck,
  IconChevronCompactLeft,
  IconChevronLeft,
  IconChevronsLeft,
  IconChevronsRight,
  IconDeviceGamepad2,
  IconGoGame,
  IconPoint,
  IconPresentation,
  IconRefresh,
  IconScoreboard,
  IconSelect,
  IconUserFilled,
} from "@tabler/icons-react";
import { AxiosError } from "axios";
import { UUID } from "crypto";

type SelectPlyerProps = {
  participants: UserWithSidequestInfo[];
  set_user_id: (id: UUID) => void;
  next_step: () => void;
  prev_step: () => void;
  refetch: () => void;
  is_refetching: boolean;
};

const SelectPlayer = ({
  participants,
  set_user_id,
  next_step,
  prev_step,
  refetch,
  is_refetching,
}: SelectPlyerProps) => {
  const [filter, set_filter] = useState<string>();

  const filtered_participants = participants.filter((p) =>
    p.user_name.toLowerCase().includes(filter?.toLowerCase() || ""),
  );

  const get_progress = (p: UserWithSidequestInfo) => {
    if (p.last_quest == undefined || p.allowed) {
      return 100;
    }
    let cooldown_ms = 60 * 60 * 1000;
    let now = new Date();
    let last_quest = local_from_string(p.last_quest);
    console.log(now, last_quest);
    let diff = new Date().getTime() - local_from_string(p.last_quest).getTime();
    console.log(diff);
    let progress = (1 - (cooldown_ms - diff) / cooldown_ms) * 100;
    console.log(progress);
    return progress;
  };

  return (
    <>
      <Flex w={"100%"} align={"center"} gap={"md"}>
        <ActionIcon onClick={prev_step} disabled={true} variant="light">
          <IconChevronsLeft />
        </ActionIcon>
        <Input
          w={"100%"}
          placeholder="Search for player"
          onChange={(e) => set_filter(e.target.value)}
        />
        <ActionIcon
          onClick={refetch}
          disabled={false}
          variant="light"
          loading={is_refetching}
        >
          <IconRefresh />
        </ActionIcon>
      </Flex>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Last Quest</Table.Th>
            <Table.Th>Cooldown</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered_participants.map((p) => {
            let date = p.last_quest ? local_from_string(p.last_quest) : "never";
            let progress = get_progress(p);
            let color = progress == 100 ? "teal" : "red";
            return (
              <Table.Tr key={p.user_id}>
                <Table.Td>{p.user_name}</Table.Td>
                <Table.Td>{date.toLocaleString()}</Table.Td>
                <Table.Td>
                  <Group>
                    <RingProgress
                      size={50}
                      thickness={10}
                      sections={[{ value: get_progress(p), color: color }]}
                    />
                    {p.allowed_at && (
                      <Text>
                        {local_from_string(p.allowed_at).toLocaleTimeString()}
                      </Text>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    variant="light"
                    disabled={!p.allowed}
                    onClick={() => {
                      set_user_id(p.user_id as UUID);
                      next_step();
                    }}
                  >
                    <IconChevronsRight />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </>
  );
};

type SelectSidequestProps = {
  sidequests: SidequestDto[];
  set_user_id: (id: UUID | undefined) => void;
  set_quest_id: (id: UUID) => void;
  next_step: () => void;
  prev_step: () => void;
};

const SelectSidequest = ({
  sidequests,
  set_user_id,
  set_quest_id,
  next_step,
  prev_step,
}: SelectSidequestProps) => {
  const [filter, set_filter] = useState<string>();

  const filtered_sidequests = sidequests.filter(
    (s) =>
      s.name.toLowerCase().includes(filter?.toLowerCase() || "") ||
      s.description.toLowerCase().includes(filter?.toLowerCase() || ""),
  );

  return (
    <Stack>
      <Flex w={"100%"} align={"center"} gap={"md"}>
        <ActionIcon
          onClick={() => {
            set_user_id(undefined);
            prev_step();
          }}
          disabled={false}
          variant="light"
        >
          <IconChevronsLeft />
        </ActionIcon>
        <Input
          w={"100%"}
          placeholder="Search for player"
          onChange={(e) => set_filter(e.target.value)}
        />
      </Flex>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Description</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered_sidequests.map((s) => (
            <Table.Tr key={s.id}>
              <Table.Td>{s.name}</Table.Td>
              <Table.Td>
                <Text truncate="end">{s.description}</Text>
              </Table.Td>
              <Table.Td>
                <ActionIcon
                  variant="light"
                  onClick={() => {
                    set_quest_id(s.id as UUID);
                    next_step();
                  }}
                >
                  <IconChevronsRight />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
};

type SelectResultProps = {
  quest: SidequestDto;
  set_result: (id: number | undefined) => void;
  next_step: () => void;
  prev_step: () => void;
  result: number | undefined;
};

const SelectResult = ({
  quest,
  result,
  set_result,
  next_step,
  prev_step,
}: SelectResultProps) => {
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && result != undefined) {
      next_step();
    }
  };

  return (
    <Stack justify="center" w={"100%"}>
      <Flex justify={"space-between"}>
        <Group>
          <ActionIcon variant="light" onClick={prev_step}>
            <IconChevronsLeft />
          </ActionIcon>

          <Title ta="center" order={2}>
            Score
          </Title>
        </Group>
        <ActionIcon
          variant="light"
          onClick={next_step}
          disabled={result == undefined}
        >
          <IconChevronsRight />
        </ActionIcon>
      </Flex>
      <Text>
        In this sidequest {quest.is_higher_result_better ? "higher" : "lower"}{" "}
        scores are better
      </Text>
      <Center>
        <Group>
          <NumberInput
            value={result}
            onChange={(e) => set_result(parseInt(e.toString()))}
            maw={300}
            onKeyDown={handleKeyPress}
          />
          <Text>Seconds</Text>
        </Group>
      </Center>
    </Stack>
  );
};

type SubmitProps = {
  quest: SidequestDto;
  user: UserWithSidequestInfo;
  result: number;
  prev: () => void;
  cancel: () => void;
  refetch: () => void;
};

const SubmitSidequestAttempt = ({
  quest,
  user,
  result,
  prev,
  cancel,
  refetch,
}: SubmitProps) => {
  const mutate_query = usePostSidequestsAttempts(quest.id);
  const [loading, setLoading] = useState(false);

  return (
    <Stack>
      <Flex justify={"left"} gap={"md"} align={"center"}>
        <ActionIcon onClick={prev} variant="light">
          <IconChevronsLeft />
        </ActionIcon>
        <Stack>
          <Title order={2}>Summary</Title>
        </Stack>
      </Flex>
      <Flex gap={"md"} align="center" justify={"center"}>
        <ThemeIcon variant="light">
          <IconDeviceGamepad2 />
        </ThemeIcon>
        <Text>{quest.name}</Text>

        <ThemeIcon variant="light">
          <IconUserFilled />
        </ThemeIcon>
        <Text>{user.user_name}</Text>

        <ThemeIcon variant="light">
          <IconPresentation />
        </ThemeIcon>

        <Text>{result} Seconds</Text>
      </Flex>
      <Flex justify={"center"} gap={"md"}>
        <Button color="gray" w={200} onClick={cancel}>
          Cancel
        </Button>

        <Button
          w={200}
          loading={loading}
          color="teal"
          onClick={() => {
            setLoading(true);
            mutate_query.mutate(
              { result: result, user_id: user.user_id },
              {
                onSuccess(data, variables, context) {
                  setLoading(false);
                  refetch();
                  cancel();
                },
                onError(error, variables, context) {
                  alert(error);
                  setLoading(false);
                },
              },
            );
          }}
        >
          Submit
        </Button>
      </Flex>
    </Stack>
  );
};

type Props = {
  event_id: UUID;
};
const CreateSidequestAttempt = ({ event_id }: Props) => {
  const { data: my_roles } = useGetEventRoles(event_id);
  const {
    data: sidequests,
    refetch: sidequest_refetch,
    isFetching: sidequest_loading,
  } = useGetSidequests({ event_id: event_id });
  const {
    data: participants,
    refetch: participants_refetch,
    isFetching: participate_loading,
  } = useGetParticipantsWithSidequestInfo({ event_id: event_id });

  const [quest_id, set_quest_id] = useState<UUID>();
  const [user_id, set_user_id] = useState<UUID>();
  const [result, set_result] = useState<number>();

  // stepper
  const [active, setActive] = useState(0);
  const nextStep = () =>
    setActive((current) => (current < 3 ? current + 1 : current));
  const prevStep = () =>
    setActive((current) => (current > 0 ? current - 1 : current));
  const set_state = (num: number) => setActive(num);

  let selected_quest = sidequests?.find((quest) => quest.id == quest_id);
  let selected_user = participants?.find((user) => user.user_id == user_id);

  const reset = () => {
    set_quest_id(undefined);
    set_user_id(undefined);
    set_result(undefined);
    participants_refetch();
    setActive(0);
  };

  const reload_participants = () => {
    participants_refetch();
  };

  if (my_roles == undefined) {
    return null;
  }

  if (!(my_roles.includes("SidequestMaster") || my_roles.includes("Admin"))) {
    return (
      <>
        <Text> You do not have permission to view this page. </Text>
      </>
    );
  }

  if (sidequests == undefined || participants == undefined) {
    return (
      <>
        <Text> Loading... </Text>
      </>
    );
  }

  return (
    <Card withBorder mih={"400"}>
      <Stack>
        <Stepper active={active} allowNextStepsSelect={false}>
          <Stepper.Step label="Player" description="Select the Participant" />
          <Stepper.Step label="Sidequest" description="Select the Sidequest" />
          <Stepper.Step label="Score" description="Score high" />
          <Stepper.Step label="Summary" description="Submit the Attempt" />
        </Stepper>
        {active == 0 && (
          <SelectPlayer
            participants={participants}
            set_user_id={set_user_id}
            next_step={nextStep}
            prev_step={prevStep}
            refetch={reload_participants}
            is_refetching={participate_loading}
          />
        )}
        {active == 1 && (
          <SelectSidequest
            sidequests={sidequests}
            set_quest_id={set_quest_id}
            set_user_id={set_user_id}
            next_step={nextStep}
            prev_step={prevStep}
          />
        )}
        {active == 2 && (
          <>
            {quest_id && user_id && selected_quest && (
              <SelectResult
                quest={selected_quest}
                result={result}
                set_result={set_result}
                next_step={nextStep}
                prev_step={prevStep}
              />
            )}
          </>
        )}
        {active == 3 && selected_quest && selected_user && result && (
          <SubmitSidequestAttempt
            quest={selected_quest}
            user={selected_user}
            result={result}
            prev={prevStep}
            cancel={reset}
            refetch={reload_participants}
          />
        )}
      </Stack>
    </Card>
  );
};

export { CreateSidequestAttempt };
