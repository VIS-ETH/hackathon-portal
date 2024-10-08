"use client";

import QueryProvider from "../contexts/QueryContext";
import "./globals.css";

import ErrorNotificationsAffix from "@/components/notifications/ErrorNotificationsAffix";
import { ErrorContextProvider } from "@/contexts/ErrorContext";
import { MantineContextProvider } from "@/contexts/MantineContext";

import { PropsWithChildren } from "react";
import { IntlProvider } from "react-intl";

import { ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";

import "@mantine/carousel/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

const Layout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <html lang="en">
      <head>
        {/* Prevent color scheme flashes */}
        <ColorSchemeScript />
      </head>
      <body>
        <ErrorContextProvider>
          <IntlProvider locale="de">
            <QueryProvider>
              <MantineContextProvider>
                {children}
                <ErrorNotificationsAffix />
              </MantineContextProvider>
            </QueryProvider>
          </IntlProvider>
        </ErrorContextProvider>
      </body>
    </html>
  );
};

export default Layout;
