import { Project, ProjectPreferences, Team, useGetProjects, useGetTeamProjectPreferences, useGetTeams } from "@/api/gen";
import { Group, Stack, Title, Text, Select, Grid, Badge, Flex, ActionIcon } from "@mantine/core";
import { IconCreativeCommons, IconDeviceFloppy, IconRoute2 } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { useState } from "react";


const unhappy_score = (team_preference : ProjectPreferences, project_id: string ) => {
    const index = team_preference.project_preferences.indexOf(project_id);
    return index === -1 ? 4 : index;
}


const TeamPreference = ({team, projects, prov_project} : {team: Team, projects: Project[], prov_project:string | undefined}) => {

    const {data: team_preference } = useGetTeamProjectPreferences(team.id);

    const id_project_mapping = projects.reduce((acc, project) => {
        acc[project.id] = project;
        return acc;
    }, {} as Record<string, Project>);

    const [selected_project, setSelectedProject] = useState<string | null>(prov_project||null);

    return (
        <Grid w={"100%"} align="center">
            <Grid.Col span={3}>
                <Group align="center">

            <Badge variant="outline">#{team.index.toString().padStart(2,"0")}</Badge>
            <Title order={4}>{team.name}</Title>
                </Group>
            </Grid.Col>
            <Grid.Col span={6}>
                <Group>

            {team_preference && team_preference.project_preferences.map((pref, index) => (
                <>
                <Text >{id_project_mapping[pref].name}</Text>
                {index != 2 && <Text>{">"}</Text>}
                </>
            ))}
            </Group>
            </Grid.Col>
            <Grid.Col span={2}>
            <Select data={projects.map((project) => {return {value: project.id, label: project.name}})} value={selected_project} placeholder="Select Project" onChange={setSelectedProject}/>
            </Grid.Col>
            <Grid.Col span={1}>
            {team_preference && team_preference.project_preferences.length > 0 && selected_project ? (
                <Badge w={"100%"}>{unhappy_score(team_preference, selected_project)}</Badge>
            ) : (
<Badge w={"100%"} variant="light"></Badge>
            )}

            </Grid.Col>
        </Grid>
    );
}


const ProjectAssignment = () => {

    const {eventSlug} = useParams<{eventSlug: string}>();

    const event_id = "fae4d7ff-ee08-4e16-8802-a1b1797145d5"
    const {data: teams } = useGetTeams({event_id: event_id});
    const {data: projects} = useGetProjects({event_id: event_id});


    // const [project_assignment, set_project_assignment] = useState<Map<string, string>>(new Map<string, string>());

        const project_assignment = new Map<string, string>();

        if (teams && projects) {
            projects.forEach((project) => {
                teams.forEach((team) => {
                    project_assignment.set(team.id, project.id);
                });
            });
        }
    return (
        <Stack>
            <Flex justify={"space-between"}>
            <Title order={3}>Project Assignment</Title>
            <Group>

            <ActionIcon onClick={() => {}}>
                <IconRoute2/>
            </ActionIcon>
            <ActionIcon onClick={() => {}}>
                <IconDeviceFloppy/>
            </ActionIcon>
            </Group>
            </Flex>
            {teams && projects && project_assignment && teams.map((team) => (
                <Group key={team.id}>
                    <TeamPreference team={team} projects={projects} prov_project={project_assignment.get(team.id)}/>
                </Group>
            ))}
        </Stack>
    );
}


export default ProjectAssignment;