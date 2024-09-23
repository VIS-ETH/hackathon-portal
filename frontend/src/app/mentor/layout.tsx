"use client";
import { Footer } from "@/componentes/layout/footer";
import Navbar from "@/componentes/layout/navbar";
import { PropsWithChildren } from "react";

const tabs = [
  { label: 'Home', path: '/mentor' },
  { label: 'Time Schedule', path: '/mentor/schedule' },
  { label: 'My Teams', path: '/mentor/teams' },
  { label: 'Information', path: '/mentor/info' },
];


export default function Layout({ children }: Readonly<PropsWithChildren>) {


  return (
    <>
      <Navbar items={tabs} section="MENTOR">
        {children}
        <Footer />
      </Navbar>
    </>
  );
}
