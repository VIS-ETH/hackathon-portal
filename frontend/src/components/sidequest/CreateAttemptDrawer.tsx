import MarkdownCard from "../MarkdownCard";
import CooldownText from "./CooldownText";

import {
  useCreateSidequestAttempt,
  useGetSidequest,
  useGetSidequestAttemptCooldown,
  useGetSidequests,
  useGetTeamAffiliates,
  useGetTeams,
} from "@/api/gen";
import { AttemptForCreate, TeamRole } from "@/api/gen/schemas";
import { inputProps, primaryButtonProps } from "@/styles/common";

import { useEffect } from "react";

import {
  Button,
  Drawer,
  NumberInput,
  NumberInputProps,
  Select,
  SelectProps,
  Stack
} from "@mantine/core";

import { useForm } from "@mantine/form";


type CreateAttemptDrawerProps = {
  eventId: string;
  opened: boolean;
  onClose: () => void;
  refetch?: () => void;
};

const CreateAttemptDrawer = ({
  eventId,
  opened,
  onClose,
  refetch,
}: CreateAttemptDrawerProps) => {
  const form = useForm<
    AttemptForCreate & {
      teamId: string | null;
    }
  >({
    mode: "controlled",
    validateInputOnChange: true,
  });

  const { data: teams = [] } = useGetTeams({
    event_id: eventId,
  });

  const { data: members = [] } = useGetTeamAffiliates(
    form.getValues().teamId ?? "",
    {
      role: TeamRole.Member,
    },
  );

  const { data: sidequests = [] } = useGetSidequests({
    event_id: eventId,
  });

  const { data: cooldown, refetch: refetchCooldown } =
    useGetSidequestAttemptCooldown(
      {
        event_id: eventId,
        user_id: form.getValues().user_id,
      },
      {
        query: {
          enabled: !!form.getValues().user_id,
        },
      },
    );

  const { data: sidequest } = useGetSidequest(form.getValues().sidequest_id);

  const createAttemptMutation = useCreateSidequestAttempt();

  useEffect(() => {
    form.reset();
  }, [form.setInitialValues, form.reset, opened]);

  const handleSubmit = async (data: AttemptForCreate) => {
    await createAttemptMutation.mutateAsync({
      data,
    });

    refetchCooldown();
    refetch?.();
    onClose();
  };

  const canAttempt = form.getValues().user_id && !cooldown?.next_attempt;

  return (
    <Drawer
      position="right"
      opened={opened}
      onClose={onClose}
      title="Create Attempt"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            {...(inputProps as SelectProps)}
            {...form.getInputProps("teamId")}
            key={form.key("teamId")}
            data={teams.map((team) => ({
              label: team.name,
              value: team.id,
            }))}
            placeholder="Select Team"
            searchable
            clearable
          />
          {form.getValues().teamId && (
            <Select
              {...(inputProps as SelectProps)}
              {...form.getInputProps("user_id")}
              key={form.key("user_id")}
              data={members.map((member) => ({
                label: member.name,
                value: member.id,
              }))}
              placeholder="Select Member"
              searchable
              clearable
            />
          )}
          {form.getValues().user_id && cooldown && (
            <CooldownText cooldown={cooldown} />
          )}
          {canAttempt && (
            <Select
              {...(inputProps as SelectProps)}
              {...form.getInputProps("sidequest_id")}
              key={form.key("sidequest_id")}
              data={sidequests.map((sidequest) => ({
                label: sidequest.name,
                value: sidequest.id,
              }))}
              placeholder="Select Sidequest"
              searchable
              clearable
            />
          )}
          {canAttempt && form.getValues().sidequest_id && (
            <>
              <MarkdownCard content={sidequest?.description ?? ""} />
              <NumberInput
                {...(inputProps as NumberInputProps)}
                {...form.getInputProps("result")}
                key={form.key("result")}
                label="Result"
                description="Refer to the sidequest description for the expected unit"
                required
              />
              <Button
                {...primaryButtonProps}
                type="submit"
                disabled={!form.isValid()}
              >
                Create
              </Button>
            </>
          )}
        </Stack>
      </form>
    </Drawer>
  );
};

export default CreateAttemptDrawer;
