"use client";

import AppLayout from "@/components/layout/AppLayout";

import { PropsWithChildren, Suspense } from "react";

const Layout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <AppLayout
      showFooter={true}
      showHeader={false}
      suppressDiscordBanner={true}
    >
      <Suspense>{children}</Suspense>
    </AppLayout>
  );
};

export default Layout;
