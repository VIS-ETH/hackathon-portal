"use client";

import AppLayout from "@/components/layout/AppLayout";

import { PropsWithChildren } from "react";

const Layout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <AppLayout
      showFooter={true}
      showHeader={false}
      suppressDiscordBanner={true}
    >
      {children}
    </AppLayout>
  );
};

export default Layout;
