"use client";

import { useGetEvents } from "@/api/gen";

import Link from "next/link";

export default function Home() {
  const eventSlug = "1"; // useGetCurrentEventSlug();

  const { data } = useGetEvents();
  // console.log(data)

  return (
    <>
      <p>Please select the role you want to assume for now. (Visualy only)</p>
      {JSON.stringify(data)}
      <ol>
        <li>
          <Link href={`/${eventSlug}/participant`}>Member</Link>
        </li>
        <li>
          <Link href={`/${eventSlug}/mentor`}>Mentor</Link>
        </li>
        <li>
          <Link href={`/${eventSlug}/team`}>Team</Link>
        </li>
      </ol>
    </>
  );
}
