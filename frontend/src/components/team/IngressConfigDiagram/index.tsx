import {
  AccessControlMode,
  CustomIngressConfig,
  IngressConfig,
  ManagedIngressConfig,
  Team,
} from "@/api/gen/schemas";

import { useEffect, useId, useRef } from "react";

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
  const id = `ingress-diagram-${useId().replace(/[^\w-]/g, "")}`;

  const chart = getChart(team, currentConfig);

  useEffect(() => {
    mermaid.initialize({});
  }, []);

  useEffect(() => {
    let cancelled = false;
    mermaid.render(id, chart).then(({ svg }) => {
      if (!cancelled && containerRef.current) {
        containerRef.current.innerHTML = svg;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, chart]);

  return <Center ref={containerRef} />;
};

// An edge from the internet, labeled with the address if the team has one.
const internetEdge = (address: string | null | undefined, to: string) =>
  address ? `inet -- ${address} --> ${to};` : `inet --> ${to};`;

const getChartManaged = (team: Team, config: ManagedIngressConfig) => {
  const inetToRp = internetEdge(
    team.managed_address && `https://${team.managed_address}`,
    "rp",
  );

  switch (config.access_control_mode) {
    case AccessControlMode.AuthenticationAuthorization:
      return `
        graph TD
          inet{Internet};
          rp(<b>Our Reverse Proxy</b><br>Terminates TLS);
          auth(<b>Our Authentication & Authorization</b><br>Verifies Login & Permissions);
          vm(<b>Your Server</b><br>http://0.0.0.0:${config.server_port});

          ${inetToRp}
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

          ${inetToRp}
          rp --> auth;
          auth -- <b>New Headers</b><br>X-User-Id<br>X-User-Name --> vm;
      `;
    case AccessControlMode.None:
      return `
        graph TD
          inet{Internet};
          rp(<b>Our Reverse Proxy</b><br>Terminates TLS);
          vm(<b>Your Server</b><br>http://0.0.0.0:${config.server_port});

          ${inetToRp}
          rp --> vm;
      `;
  }
};

const getChartCustom = (team: Team, config: CustomIngressConfig) => {
  const serverProtocol = config.server_protocol.toLocaleLowerCase();
  const inetToVm = internetEdge(
    team.direct_address &&
      `${serverProtocol}://${team.direct_address}:${config.server_port}`,
    "vm",
  );

  return `
    graph TD
      inet{Internet};
      vm(<b>Your Server</b><br>${serverProtocol}://0.0.0.0:${config.server_port});

      ${inetToVm}
  `;
};

const getChart = (team: Team, config: IngressConfig) => {
  if (config.mode === "Managed") {
    return getChartManaged(team, config.config);
  } else {
    return getChartCustom(team, config.config);
  }
};

export default IngressConfigDiagram;
