"use client";
import { Footer } from "@/componentes/layout/footer";
import Navbar from "@/componentes/layout/navbar";
import { PropsWithChildren } from "react";

const tabs = [
  { label: 'Home', path: '/team' },
  { label: 'Time Schedule', path: '/team/schedule' },
  { label: 'Teams', path: '/team/teams' },
  { label: 'Projects', path: '/team/projects' },
  { label: 'Sidequests', path: '/team/sidequests' },
];


export default function Layout({ children }: Readonly<PropsWithChildren>) {


  return (
    <>
      <Navbar items={tabs} section="TEAM">
        {children}
        <Footer />
      </Navbar>
    </>
  );
}
