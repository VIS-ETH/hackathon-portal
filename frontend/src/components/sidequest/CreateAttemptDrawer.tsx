import DrawerMarkdown from "../DrawerMarkdown";
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
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { drawerProps, inputProps, primaryButtonProps } from "@/styles/common";

import { useState } from "react";

import { Button, Drawer, NumberInput, Stack } from "@mantine/core";

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
  const [result, setResult] = useState<number | string>(0);
  const [prevOpened, setPrevOpened] = useState(opened);

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

  const confirmClose = useUnsavedChanges(
    !!team || !!user || !!sidequest || result !== 0,
  );

  const reset = () => {
    setTeam(undefined);
    setUser(undefined);
    setSidequest(undefined);
    setResult(0);
  };

  if (opened !== prevOpened) {
    setPrevOpened(opened);
    reset();
  }

  const handleSubmit = async () => {
    if (!team || !user || !sidequest || typeof result !== "number") {
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
      {...drawerProps}
      opened={opened}
      onClose={() => confirmClose() && onClose()}
      title="Create Attempt"
    >
      <Stack>
        <SidequestSelect
          eventId={eventId}
          sidequestId={sidequest?.id}
          setSidequest={setSidequest}
        />
        {sidequest && (
          <>
            <TeamSelect
              eventId={eventId}
              teamId={team?.id}
              setTeam={(team) => {
                setTeam(team);
                setUser(undefined);
              }}
            />
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
                        <NumberInput
                          {...inputProps}
                          value={result}
                          onChange={setResult}
                          label="Result"
                          description="Refer to the sidequest description for the expected unit"
                          required
                        />
                        <Button
                          {...primaryButtonProps}
                          disabled={typeof result !== "number"}
                          onClick={handleSubmit}
                          loading={createAttemptMutation.isPending}
                        >
                          Create
                        </Button>
                      </>
                    )}
                  </>
                )}
              </>
            )}
            <DrawerMarkdown content={sidequest.description} />
          </>
        )}
      </Stack>
    </Drawer>
  );
};

export default CreateAttemptDrawer;
