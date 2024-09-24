"use client";
import { PropsWithChildren } from "react";
import AppLayout from "@/componentes/layout/app-layout";

const tabs = [
  { label: 'Home', path: '/team' },
  { label: 'Time Schedule', path: '/team/schedule' },
  { label: 'Teams', path: '/team/teams' },
  { label: 'Projects', path: '/team/projects' },
  { label: 'Sidequests', path: '/team/sidequests' },
];


const user = {
  name: 'Andri Florin',
  email: 'florina@vis.ethz.ch',
  image: 'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-5.png',
};

export default function Layout({ children }: Readonly<PropsWithChildren>) {

  return (
    <>
      <AppLayout headerItems={tabs} section="TEAM" user={user}>
        {children}
      </AppLayout>
    </>
  );
}
