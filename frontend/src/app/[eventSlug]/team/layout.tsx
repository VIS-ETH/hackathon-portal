"use client";

import AppLayout from "@/componentes/layout/app-layout";

import { PropsWithChildren } from "react";

import { useParams } from "next/navigation";

const tabs = [
  { label: "Home", path: "/team" },
  { label: "Time Schedule", path: "/team/schedule" },
  { label: "Teams", path: "/team/teams" },
  { label: "Projects", path: "/team/projects" },
  { label: "Sidequests", path: "/team/sidequests" },
];

const user = {
  name: "Andri Florin",
  email: "florina@vis.ethz.ch",
  image:
    "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-5.png",
};

export default function Layout({ children }: Readonly<PropsWithChildren>) {
  const { eventSlug: slug } = useParams<{ eventSlug: string }>();

  return (
    <>
      <AppLayout
        headerItems={tabs}
        section="TEAM"
        user={user}
        pathBaseUrl={`/${slug}`}
      >
        {children}
      </AppLayout>
    </>
  );
}
