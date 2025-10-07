import {
  AccessControlMode,
  CustomIngressConfig,
  IngressConfig,
  ManagedIngressConfig,
  Team,
} from "@/api/gen/schemas";

import { useEffect, useRef } from "react";

import { Center } from "@mantine/core";

import mermaid from "mermaid";

type IngressConfigDiagramProps = {
  team: Team;
  currentConfig: IngressConfig;
};

const IngressConfigDiagram = ({
  team,
  currentConfig,
}: IngressConfigDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const chart = getChart(team, currentConfig);

  useEffect(() => {
    mermaid.initialize({});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && containerRef.current) {
      containerRef.current.removeAttribute("data-processed");
      mermaid.contentLoaded();
    }
  }, [chart]);

  return (
    <Center className="mermaid" ref={containerRef}>
      {chart}
    </Center>
  );
};

const getChartManaged = (team: Team, config: ManagedIngressConfig) => {
  switch (config.access_control_mode) {
    case AccessControlMode.AuthenticationAuthorization:
      return `
        graph TD
          inet{Internet};
          rp(<b>Our Reverse Proxy</b><br>Terminates TLS);
          auth(<b>Our Authentication & Authorization</b><br>Verifies Login & Permissions);
          vm(<b>Your Server</b><br>http://0.0.0.0:${config.server_port});

          inet -- https://${team.managed_address} --> rp;
          rp --> auth;
          auth -- <b>New Headers</b><br>X-User-Id<br>X-User-Name --> vm;
      `;
    case AccessControlMode.Authentication:
      return `
        graph TD
          inet{Internet};
          rp(<b>Our Reverse Proxy</b><br>Terminates TLS);
          auth(<b>Our Authentication</b><br>Verifies Login);
          vm(<b>Your Server</b><br>http://0.0.0.0:${config.server_port});

          inet -- https://${team.managed_address} --> rp;
          rp --> auth;
          auth -- <b>New Headers</b><br>X-User-Id<br>X-User-Name --> vm;
      `;
    case AccessControlMode.None:
      return `
        graph TD
          inet{Internet};
          rp(<b>Our Reverse Proxy</b><br>Terminates TLS);
          vm(<b>Your Server</b><br>http://0.0.0.0:${config.server_port});

          inet -- https://${team.managed_address} --> rp;
          rp --> vm;
      `;
  }
};

const getChartCustom = (team: Team, config: CustomIngressConfig) => {
  const serverProtocol = config.server_protocol.toLocaleLowerCase();

  return `
    graph TD
      inet{Internet};
      vm(<b>Your Server</b><br>${serverProtocol}://0.0.0.0:${config.server_port});

      inet -- ${serverProtocol}://${team.direct_address}:${config.server_port} --> vm;
  `;
};

const getChart = (team: Team, config: IngressConfig) => {
  if (config.mode == "Managed") {
    return getChartManaged(team, config.config);
  } else {
    return getChartCustom(team, config.config);
  }
};

export default IngressConfigDiagram;
