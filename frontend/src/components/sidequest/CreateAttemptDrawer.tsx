import MarkdownCard from "../MarkdownCard";
import SidequestSelect from "../select/SidequestSelect";
import TeamAffiliateSelect from "../select/TeamAffiliateSelect";
import TeamSelect from "../select/TeamSelect";
import CooldownText from "./CooldownText";

import {
  useCreateSidequestAttempt,
  useGetSidequestAttemptCooldown,
} from "@/api/gen";
import {
  AttemptForCreate,
  Sidequest,
  Team,
  TeamAffiliate,
  TeamRole,
} from "@/api/gen/schemas";
import { inputProps, primaryButtonProps } from "@/styles/common";

import { useEffect, useState } from "react";

import {
  Button,
  Drawer,
  NumberInput,
  NumberInputProps,
  Stack,
} from "@mantine/core";

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
  const [team, setTeam] = useState<Team | undefined>();
  const [user, setUser] = useState<TeamAffiliate | undefined>();
  const [sidequest, setSidequest] = useState<Sidequest | undefined>();
  const [result, setResult] = useState<number>(0);

  const { data: cooldown, refetch: refetchCooldown } =
    useGetSidequestAttemptCooldown(
      {
        event_id: eventId,
        user_id: user?.id,
      },
      {
        query: {
          enabled: !!user,
        },
      },
    );

  const createAttemptMutation = useCreateSidequestAttempt();

  useEffect(() => {
    reset();
  }, [opened]);

  const reset = () => {
    setTeam(undefined);
    setUser(undefined);
    setSidequest(undefined);
    setResult(0);
  };

  const handleSubmit = async () => {
    if (!team || !user || !sidequest) {
      return;
    }

    const data: AttemptForCreate = {
      result: result,
      sidequest_id: sidequest.id,
      user_id: user.id,
    };

    await createAttemptMutation.mutateAsync({
      data,
    });

    refetchCooldown();
    refetch?.();
    onClose();
  };

  const canAttempt = !cooldown?.next_attempt;

  return (
    <Drawer
      position="right"
      opened={opened}
      onClose={onClose}
      title="Create Attempt"
    >
      <Stack>
        <TeamSelect eventId={eventId} teamId={team?.id} setTeam={setTeam} />
        {team && (
          <>
            <TeamAffiliateSelect
              teamId={team.id}
              affiliateId={user?.id}
              setAffiliate={setUser}
              role={TeamRole.Member}
            />
            {user && (
              <>
                {cooldown && <CooldownText cooldown={cooldown} />}
                {canAttempt && (
                  <>
                    <SidequestSelect
                      eventId={eventId}
                      sidequestId={sidequest?.id}
                      setSidequest={setSidequest}
                    />
                    {sidequest && (
                      <>
                        <MarkdownCard content={sidequest.description} />
                        <NumberInput
                          {...(inputProps as NumberInputProps)}
                          value={result}
                          onChange={(value) =>
                            setResult(
                              typeof value === "number"
                                ? value
                                : parseFloat(value),
                            )
                          }
                          label="Result"
                          description="Refer to the sidequest description for the expected unit"
                          required
                        />
                        <Button {...primaryButtonProps} onClick={handleSubmit}>
                          Create
                        </Button>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </Stack>
    </Drawer>
  );
};

export default CreateAttemptDrawer;
