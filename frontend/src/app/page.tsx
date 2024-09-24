'use client';

import Link from "next/link";

export default function Home() {
  const eventSlug = "1" // useGetCurrentEventSlug();

  return (
    <>
      <p>Please select the role you want to assume for now. (Visualy only)</p>
      <ol>
        <li><Link href={`/${eventSlug}/participant`}>Member</Link></li>
        <li><Link href={`/${eventSlug}/mentor`}>Mentor</Link></li>
        <li><Link href={`/${eventSlug}/team`}>Team</Link></li>
      </ol>
    </>
  );
}
