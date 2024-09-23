'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  return (
    <>
      <p>Please select the role you want to assume for now. (Visualy only)</p>
      <ol>
        <li><Link href="/member">Member</Link></li>
        <li><Link href="/mentor">Mentor</Link></li>
        <li><Link href="/team">Team</Link></li>
      </ol>
    </>
  );
}
