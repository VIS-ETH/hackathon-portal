"use client";

import QueryProvider from "./QueryProvider";
import "./globals.css";

import { PropsWithChildren } from "react";
import { IntlConfig, IntlProvider } from "react-intl";

import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";

import "@mantine/carousel/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

const theme = createTheme({});

export default function RootLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <html lang="en">
      <head></head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <IntlProvider locale="de">
            <QueryProvider>{children}</QueryProvider>
          </IntlProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
