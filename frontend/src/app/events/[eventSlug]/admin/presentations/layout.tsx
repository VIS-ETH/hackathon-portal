import { PropsWithChildren } from "react";

import { Overlay } from "@mantine/core";

const Layout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <Overlay backgroundOpacity={1} color="#fff">
      {children}
    </Overlay>
  );
};

export default Layout;
