"use client";

import { useGetEventRoles, useGetSidequests } from "@/api/gen";
import ScoreChart from "@/componentes/ScoreChart";
import SidequestLeaderboard from "@/componentes/SidequestLeaderboard";
import SidequestTeamLeaderboard from "@/componentes/SidequestTeamLeaderboard";

import { useState } from "react";

import { Button, Flex, Group, SegmentedControl, Select } from "@mantine/core";

import { UUID } from "crypto";
import Link from "next/link";

export default function Page() {
  const event_id = "fae4d7ff-ee08-4e16-8802-a1b1797145d5";
  const { data } = useGetSidequests({ event_id: event_id });
  const selector = ["Overview"].concat(data?.map((item) => item.name) || []);
  const { data: my_roles } = useGetEventRoles(event_id);

  const [selected, setSelected] = useState<string>("Overview");
  const selected_id = data?.find((item) => item.name == selected)?.id as UUID;
  console.log(my_roles);
  return (
    <>
      {data && (
        <Flex justify={"end"} gap={"md"}>
          {(my_roles?.includes("Admin") ||
            my_roles?.includes("SidequestMaster")) && (
            <Link href={`/${event_id}/participant/sidequests/attempt`}>
              <Button variant="outline">Add Attempt</Button>
            </Link>
          )}
          <Select
            data={selector}
            value={selected}
            onChange={(value) => setSelected(value || "Overview")}
          />
        </Flex>
      )}
      {selected == "Overview" && (
        <>
          <ScoreChart />
          <SidequestTeamLeaderboard eventId={event_id} />
        </>
      )}
      {selected != "Overview" && selected_id && (
        <SidequestLeaderboard sidequestId={selected_id} />
      )}
    </>
  );
}
