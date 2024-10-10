import { useGetEventAffiliates, useGetExpertRatings } from "@/api/gen";
import {
  EventAffiliate,
  EventRole,
  ExpertRatingCategory,
  ExpertRatingLeaderboardEntry,
  Team,
} from "@/api/gen/schemas";

import { Table } from "@mantine/core";

type TeamExpertRatingsTableProps = {
  team: Team;
  entry: ExpertRatingLeaderboardEntry;
};

const TeamExpertRatingsTable = ({
  team,
  entry,
}: TeamExpertRatingsTableProps) => {
  const { data: ratings = [] } = useGetExpertRatings({
    team_id: team.id,
  });

  const { data: affiliates = [] } = useGetEventAffiliates(team.event_id);

  const raterIds = ratings.map((r) => r.user_id);
  const expertIds = affiliates
    .filter((a) =>
      [EventRole.Admin, EventRole.Mentor, EventRole.Stakeholder].some((role) =>
        a.roles.includes(role),
      ),
    )
    .map((a) => a.id);

  // all unique users who have rated or could rate
  const users = Array.from(new Set([...raterIds, ...expertIds]))
    .map((id) => affiliates.find((a) => a.id === id))
    .filter((a) => a)
    .map((a) => a as EventAffiliate)
    .sort((a, b) => a.name.localeCompare(b.name));

  const categories = Object.keys(ExpertRatingCategory).filter(
    (category) => category in entry.categories,
  ) as ExpertRatingCategory[];

  const getRating = (userId: string, category: ExpertRatingCategory) => {
    const rating = ratings.find(
      (r) => r.user_id === userId && r.category === category,
    );

    return rating?.rating ?? "-";
  };

  return (
    <Table layout="fixed">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Expert</Table.Th>
          {categories.map((category) => (
            <Table.Th key={category} ta="right">
              {
                ExpertRatingCategory[
                  category as keyof typeof ExpertRatingCategory
                ]
              }
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {users
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((user) => (
            <Table.Tr key={user.id}>
              <Table.Td>{user.name}</Table.Td>
              {categories.map((category) => (
                <Table.Td key={category} ta="right">
                  {getRating(user.id, category)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        <Table.Tr>
          <Table.Th>Average</Table.Th>
          {categories.map((category) => (
            <Table.Th key={category} ta="right">
              {entry.categories[category]}
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default TeamExpertRatingsTable;
