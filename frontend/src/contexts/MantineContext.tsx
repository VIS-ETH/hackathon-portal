import { useGetEventRoles } from "@/api/gen";
import { EventRole } from "@/api/gen/schemas";
import { useResolveParams } from "@/hooks/useResolveParams";

import {
  DEFAULT_THEME,
  MantineColorsTuple,
  MantineProvider,
  createTheme,
} from "@mantine/core";

export const MantineContextProvider = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const { event } = useResolveParams();
  const { data: roles } = useGetEventRoles(event?.id ?? "", {
    query: {
      enabled: !!event,
    },
  });

  const primary = (() => {
    if (roles?.includes(EventRole.Admin)) {
      return BLUE_GRAY;
    } else if (roles?.includes(EventRole.Mentor)) {
      return DEFAULT_THEME.colors.green;
    } else if (roles?.includes(EventRole.SidequestMaster)) {
      return DEFAULT_THEME.colors.violet;
    } else if (roles?.includes(EventRole.Stakeholder)) {
      return DEFAULT_THEME.colors.orange;
    } else if (roles?.includes(EventRole.Participant)) {
      return DEFAULT_THEME.colors.blue;
    } else {
      return DEFAULT_THEME.colors.gray;
    }
  })();

  const theme = createTheme({
    primaryColor: "primary",
    colors: {
      primary,
    },
  });

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
};

// https://mantine.dev/colors-generator
const BLUE_GRAY: MantineColorsTuple = [
  "#f1f4fe",
  "#e4e6ed",
  "#c8cad3",
  "#a9adb9",
  "#9094a3",
  "#7f8496",
  "#777c91",
  "#656a7e",
  "#595e72",
  "#4a5167",
];
