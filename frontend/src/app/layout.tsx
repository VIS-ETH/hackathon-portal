"use client";

import "./globals.css";

import { PropsWithChildren } from "react";

import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";

import "@mantine/carousel/styles.css";
import "@mantine/notifications/styles.css";

const theme = createTheme({});

export default function RootLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <html lang="en">
      <head></head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
