"use client";

import AppLayout from "@/componentes/layout/app-layout";

import { PropsWithChildren } from "react";

import { useParams } from "next/navigation";

const tabs = [
  { label: "Home", path: "/mentor" },
  { label: "Time Schedule", path: "/mentor/schedule" },
  { label: "My Teams", path: "/mentor/teams" },
  { label: "Information", path: "/mentor/info" },
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
        section="MENTOR"
        user={user}
        pathBaseUrl={`/${slug}`}
      >
        {children}
      </AppLayout>
    </>
  );
}
