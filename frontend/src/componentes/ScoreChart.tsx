import { TimelineData } from "@/api/gen";
import { useGetLeaderboardTimeline } from "@/api/gen/hooks/useGetLeaderboardTimeline";

import { ApexOptions } from "apexcharts";
import { time } from "console";
import dayjs from "dayjs";
import dynamic from "next/dynamic";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ScoreChart() {
  const now = new Date();

  const { data } = useGetLeaderboardTimeline({
    event_id: "fae4d7ff-ee08-4e16-8802-a1b1797145d5",
  });

  const get_series = (data: TimelineData | undefined) => {
    if (data == undefined) {
      return {
        // name: "No data",
        data: [],
      } as unknown as ApexAxisChartSeries;
    }

    const series = Object.entries(data.scores).map(([key, value]) => {
      return {
        name: key,
        data: value.map(([time, score]) => {
          return { x: time, y: score };
        }),
      };
    });
    return series;
  };

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
      tooltip: {
        formatter: (value: string, opts: object | undefined) => {
          return dayjs(value).format("YYYY-MM-DD HH:mm:ss");
        },
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
    <>
      {data && (
        <ApexChart
          type="line"
          options={options}
          series={get_series(data)}
          height={400}
          // width={500}
        />
      )}
    </>
  );
}
