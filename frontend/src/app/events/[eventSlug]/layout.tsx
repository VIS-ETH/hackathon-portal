"use client";

import AppLayout from "@/components/layout/AppLayout";

import { PropsWithChildren } from "react";

import { usePathname } from "next/navigation";

const Layout = ({ children }: Readonly<PropsWithChildren>) => {
  // the admin tables need more room than the other pages
  const wide = usePathname().endsWith("/admin");

  return <AppLayout wide={wide}>{children}</AppLayout>;
};

export default Layout;
