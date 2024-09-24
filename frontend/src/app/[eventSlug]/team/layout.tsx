"use client";
import { PropsWithChildren } from "react";
import AppLayout from "@/componentes/layout/app-layout";
import { useParams } from "next/navigation";

const tabs = [
  { label: 'Home', path: '' },
  { label: 'Time Schedule', path: '/schedule' },
  { label: 'Teams', path: '/teams' },
  { label: 'Projects', path: '/projects' },
  { label: 'Sidequests', path: '/sidequests' },
];


const user = {
  name: 'Andri Florin',
  email: 'florina@vis.ethz.ch',
  image: 'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-5.png',
};

export default function Layout({ children }: Readonly<PropsWithChildren>) {
  const {eventSlug: slug} = useParams<{eventSlug: string}>();

  return (
    <>
      <AppLayout headerItems={tabs} section="TEAM" user={user} pathBaseUrl={`/${slug}/team`}>
        {children}
      </AppLayout>
    </>
  );
}
