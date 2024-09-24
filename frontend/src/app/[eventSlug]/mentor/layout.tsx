"use client";
import { PropsWithChildren } from "react";
import AppLayout from "@/componentes/layout/app-layout";
import { useParams } from "next/navigation";

const tabs = [
  { label: 'Home', path: '' },
  { label: 'Time Schedule', path: '/schedule' },
  { label: 'My Teams', path: '/teams' },
  { label: 'Information', path: '/info' },
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
      <AppLayout headerItems={tabs} section="MENTOR" user={user} pathBaseUrl={`/${slug}/mentor`}>
        {children}
      </AppLayout>
    </>
  );
}
