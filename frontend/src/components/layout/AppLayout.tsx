import Navbar from "./Navbar";

import Footer from "@/components/layout/Footer";
import { containerProps } from "@/styles/common";

import { PropsWithChildren } from "react";

import { Box, Container } from "@mantine/core";

type AppLayoutProps = PropsWithChildren & {
  showHeader?: boolean;
  showFooter?: boolean;
};

const AppLayout = ({
  showHeader = true,
  showFooter = true,
  children,
}: Readonly<AppLayoutProps>) => {
  return (
    <>
      {showHeader && (
        <Box component="header">
          <Navbar />
        </Box>
      )}
      <Box component="main" flex="1">
        <Container {...containerProps} py="xl">
          {children}
        </Container>
      </Box>
      {showFooter && (
        <Box component="footer">
          <Footer />
        </Box>
      )}
    </>
  );
};

export default AppLayout;
