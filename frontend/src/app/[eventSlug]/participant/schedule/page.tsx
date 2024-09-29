"use client";

import TimeSchedule from "@/componentes/TimeSchedule";

export default function Page() {
  return (
    <>
      <TimeSchedule
        items={[
          {
            title: "Official Start",
            at: new Date("2024-08-01"),
            shortDescription: "The event starts",
            longDescription:
              "This is the official start of the event. It will be a great day",
          },
          {
            title: "Lunch",
            at: new Date("2024-08-21"),
            shortDescription: "Food arrives",
          },
          {
            title: "Official End",
            at: new Date("2024-09-30 23:00"),
            until: new Date("2024-09-30 23:13"),
            shortDescription: "The event ends",
          },
        ]}
      />
    </>
  );
}
