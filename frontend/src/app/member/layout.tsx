"use client";
import { Footer } from "@/componentes/layout/footer";
import Navbar from "@/componentes/layout/navbar";
import { PropsWithChildren } from "react";

const tabs = [
  { label: 'Home', path: '/member' },
  { label: 'Time Schedule', path: '/member/schedule' },
  { label: 'Documentation', path: '/member/docs' },
  { label: 'Sidequests', path: '/member/sidequests' },
];


export default function Layout({ children }: Readonly<PropsWithChildren>) {


  return (
    <>
      <Navbar items={tabs} section="MEMBER">
        {children}
        <Footer />
      </Navbar>
    </>
  );
}
