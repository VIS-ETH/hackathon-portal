import { useGetSidequestsHistory, useGetTeams } from "@/api/gen";
import { cardProps } from "@/styles/common";
import { fmtDateWeekdayTime } from "@/utils";

import { useIntl } from "react-intl";

import { Card } from "@mantine/core";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type HistoryChartProps = {
  eventId: string;
};

const HistoryChart = ({ eventId }: HistoryChartProps) => {
  const intl = useIntl();

  const { data: history = {} } = useGetSidequestsHistory(eventId, undefined, {
    query: {
      refetchInterval: 1000 * 60,
    },
  });

  const { data: teams = [] } = useGetTeams({
    event_id: eventId,
  });

  const series = Object.entries(history).map(([teamId, entries]) => {
    return {
      name: teams.find((team) => team.id === teamId)?.name ?? "Unknown",
      data: entries.map((entry) => {
        return { x: `${entry.date}Z`, y: Math.round(entry.score * 10) / 10 };
      }),
    };
  });

  const options: ApexOptions = {
    chart: {
      animations: {
        enabled: false,
      },
      type: "line",
      height: 350,
      width: 500,
    },
    stroke: {
      width: 3,
      curve: "straight",
    },
    xaxis: {
      type: "datetime",
      labels: {
        formatter: (value: string) => fmtDateWeekdayTime(value, intl),
      },
      tooltip: {
        formatter: (value: string) => fmtDateWeekdayTime(value, intl),
      },
    },
    markers: {
      hover: {
        size: 0,
      },
    },
    tooltip: {
      x: {
        show: false,
      },
    },
  };

  return (
    <Card {...cardProps}>
      <Card.Section>
        <ApexChart type="line" options={options} series={series} height={400} />
      </Card.Section>
    </Card>
  );
};

export default HistoryChart;
