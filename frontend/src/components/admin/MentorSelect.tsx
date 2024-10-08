import { useGetEventAffiliates } from "@/api/gen";
import { EventRole, Team, TeamAffiliate } from "@/api/gen/schemas";
import { inputProps } from "@/styles/common";

import { Select, SelectProps } from "@mantine/core";

type MentorSelectProps = {
  team: Team;
  mentor?: TeamAffiliate;
  setMentorId: (mentorId: string | undefined) => void;
};

const MentorSelect = ({ team, mentor, setMentorId }: MentorSelectProps) => {
  const { data: mentors } = useGetEventAffiliates(team.event_id, {
    role: EventRole.Mentor,
  });

  return (
    <Select
      {...(inputProps as SelectProps)}
      size="xs"
      data={mentors?.map((mentor) => ({
        label: mentor.name,
        value: mentor.id,
      }))}
      clearable
      value={mentor ? mentor.id : null}
      onChange={(value) =>
        value ? setMentorId(value) : setMentorId(undefined)
      }
    />
  );
};

export default MentorSelect;
