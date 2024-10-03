"use client"
import { useGetEvent } from "@/api/gen";
import EventForm from "@/componentes/EventForm";
import ProjectAssignment from "@/componentes/ProjectAssignment";
import { Stack, Title, Text, Tabs } from "@mantine/core";
import { IconCalendarEvent, IconListDetails, IconMessageCircle, IconPhoto, IconSettings, IconUsers } from "@tabler/icons-react";
import { useParams } from "next/navigation";


export default function Page () {
    const {eventSlug} = useParams<{eventSlug: string}>();

    const event_id = "fae4d7ff-ee08-4e16-8802-a1b1797145d5"
    const {data: event} = useGetEvent(event_id);

  return (
    <Stack gap={"md"}>
        
      <Title order={1}>Admin Interface</Title>
      <Tabs defaultValue="gallery">
      <Tabs.List>
        <Tabs.Tab value="gallery" leftSection={<IconSettings  />}>
          Event Settings
        </Tabs.Tab>
        <Tabs.Tab value="messages" leftSection={<IconUsers />}>
          User Management Seminar
        </Tabs.Tab>
        <Tabs.Tab value="settings" leftSection={<IconListDetails/>}>
          Project Assignment
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="gallery" my={"md"}>
      {event && <EventForm  event={event}/>}
      </Tabs.Panel>

      <Tabs.Panel value="messages" my={"md"}>
        Messages tab content
      </Tabs.Panel>

      <Tabs.Panel value="settings" my={"md"}>
        <ProjectAssignment />
      </Tabs.Panel>
    </Tabs>
      
    </Stack>
  )
}

