import DiscordBanner from "../banner/DiscordBanner";
import Navbar from "./Navbar";

import Footer from "@/components/layout/Footer";
import { containerProps, wideContainerProps } from "@/styles/common";

import { PropsWithChildren } from "react";

import { Box, Container } from "@mantine/core";

type AppLayoutProps = PropsWithChildren & {
  showHeader?: boolean;
  showFooter?: boolean;
  suppressDiscordBanner?: boolean;
  wide?: boolean;
};

const AppLayout = ({
  showHeader = true,
  showFooter = true,
  suppressDiscordBanner = false,
  wide = false,
  children,
}: Readonly<AppLayoutProps>) => {
  return (
    <>
      {showHeader && (
        <Box component="header">
          <Navbar wide={wide} />
        </Box>
      )}
      <Box component="main" flex="1">
        <Container {...(wide ? wideContainerProps : containerProps)} py="xl">
          {!suppressDiscordBanner && <DiscordBanner />}
          {children}
        </Container>
      </Box>
      {showFooter && (
        <Box component="footer">
          <Footer wide={wide} />
        </Box>
      )}
    </>
  );
};

export default AppLayout;
