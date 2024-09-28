import classes from "./app-layout.module.css";
import Navbar from "./navbar";

import Footer from "@/componentes/layout/footer";

import { PropsWithChildren } from "react";

import { Container } from "@mantine/core";

export interface AppLayoutLink {
  label: string;
  path: string;
}

export interface AppLayoutUser {
  name: string;
  email: string;
  image: string;
}

export type AppLayoutSection = "TEAM" | "MENTOR" | "PARTICIPANT";

export type AppLayoutProps = PropsWithChildren & {
  pathBaseUrl: string;
  headerItems: AppLayoutLink[];
  section: AppLayoutSection;
  user: AppLayoutUser;
};

export default function AppLayout({
  children,
  headerItems,
  section,
  user,
  pathBaseUrl,
}: Readonly<AppLayoutProps>) {
  const footerItems: AppLayoutLink[] = [
    { path: "https://viscon.ethz.ch", label: "VISCON" },
    { path: "https://vis.ethz.ch", label: "VIS" },
    { path: "https://vseth.ethz.ch", label: "VSETH" },
  ];

  return (
    <>
      <header>
        <Navbar
          user={user}
          headerItems={headerItems}
          section={section}
          baseUrl={pathBaseUrl}
        />
      </header>
      <main className={classes.main}>
        <Container>{children}</Container>
      </main>
      <footer>
        <Footer footerItems={footerItems} section={section} />
      </footer>
    </>
  );
}
