"use client";

import { useGetSidequests } from "@/api/gen";
import ScoreChart from "@/componentes/ScoreChart";
import SidequestLeaderboard from "@/componentes/SidequestLeaderboard";
import SidequestTeamLeaderboard from "@/componentes/SidequestTeamLeaderboard";

import { useState } from "react";

import { SegmentedControl } from "@mantine/core";

import { UUID } from "crypto";

export default function Page() {
  const event_id = "fae4d7ff-ee08-4e16-8802-a1b1797145d5";
  const { data } = useGetSidequests({ event_id: event_id });
  const selector = ["Overview"].concat(data?.map((item) => item.name) || []);

  const [selected, setSelected] = useState<string>("Overview");
  const selected_id = data?.find((item) => item.name == selected)?.id as UUID;
  return (
    <>
      {data && (
        <SegmentedControl
          w="100%"
          data={selector}
          value={selected}
          onChange={setSelected}
        />
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
