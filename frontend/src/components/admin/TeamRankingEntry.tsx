import IconTextGroup from "../IconTextGroup";
import RatingFeedbackCard from "../team/RatingFeedbackCard";
import ScoreDisplay from "../team/ScoreDisplay";
import TeamImage from "../team/TeamImage";

import { useUpdateTeam } from "@/api/gen";
import { ScoreNormalized } from "@/api/gen/schemas";
import { cardProps } from "@/styles/common";
import { fmtTeamIndex } from "@/utils";

import {
  Accordion,
  Box,
  Card,
  Center,
  Grid,
  Group,
  Loader,
  Stack,
  Switch,
  Text,
} from "@mantine/core";

import { IconWorld } from "@tabler/icons-react";
import Link from "next/link";

type TeamRankingEntryProps = {
  info: ScoreNormalized;
  onTeamUpdated: () => Promise<unknown>;
};

const TeamRankingEntry = ({ info, onTeamUpdated }: TeamRankingEntryProps) => {
  const team = info.team;

  const updateTeamMutation = useUpdateTeam({
    mutation: { onSuccess: onTeamUpdated },
  });
  const finalistUpdating = updateTeamMutation.isPending;

  const changeFinalist = (newFinalist: boolean) => {
    updateTeamMutation.mutate({
      teamId: team.id,
      data: {
        finalist: newFinalist,
      },
    });
  };

  const teamWebpage = team.ingress_url && (
    <IconTextGroup Icon={IconWorld}>
      <Link
        href={team.ingress_url}
        passHref
        referrerPolicy="no-referrer"
        target="_blank"
      >
        <Text>{team.ingress_url}</Text>
      </Link>
    </IconTextGroup>
  );

  return (
    <Card {...cardProps}>
      <Card.Section>
        <Accordion>
          <Accordion.Item value="team-info">
            <Group wrap="nowrap" gap={0}>
              <Accordion.Control>
                <Grid justify="center" align="center" py="md">
                  <Grid.Col span={1}>
                    <Center>
                      <Text ff="monospace">{info.rank?.toString()}</Text>
                    </Center>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Group>
                      <Text>{team.name}</Text>
                      <Text ff="mono">{fmtTeamIndex(team.index)}</Text>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <ScoreDisplay
                      extra_score={info.extra_score || 0}
                      technical_score={info.tech_score?.score_normalized || 0}
                      presentation_score={
                        info.expert_score?.score_normalized || 0
                      }
                      sidequest_score={
                        info.sidequest_score?.score_normalized || 0
                      }
                      public_voting_score={
                        info.voting_score?.score_normalized || 0
                      }
                      max_score={info.max_final_score || 0}
                    />
                    {info.tech_score == null && (
                      <Text>Technical Score could not be retrieved</Text>
                    )}
                    {info.expert_score == null && (
                      <Text>Presentation Score could not be retrieved</Text>
                    )}
                    {info.sidequest_score == null && (
                      <Text>Sidequest Score could not be retrieved</Text>
                    )}
                    {info.voting_score == null && (
                      <Text>Public Voting Score could not be retrieved</Text>
                    )}
                    {info.tech_score?.all_answered === false && (
                      <Text c="red">Not all technical questions answered</Text>
                    )}
                  </Grid.Col>
                </Grid>
              </Accordion.Control>
              <Box px="md" style={{ flexShrink: 0 }}>
                <Switch
                  size="md"
                  description="Finalist"
                  checked={team.finalist ?? false}
                  disabled={finalistUpdating}
                  thumbIcon={
                    finalistUpdating ? (
                      <Loader size={10} color="blue" />
                    ) : undefined
                  }
                  onChange={(event) =>
                    changeFinalist(event.currentTarget.checked)
                  }
                />
              </Box>
            </Group>
            <Accordion.Panel>
              <Stack>
                <Group>
                  <TeamImage
                    url={team.photo_url}
                    width={240}
                    height={160}
                    alt={team.name}
                    fit="contain"
                  />
                  {teamWebpage}
                </Group>
                <RatingFeedbackCard
                  rating={info}
                  limitedView={true}
                  autoLoadAnswers={false}
                />
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Card.Section>
    </Card>
  );
};

export default TeamRankingEntry;
