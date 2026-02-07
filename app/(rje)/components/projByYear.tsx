"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ApiData = {
  year: number;
  count: number;
};

export default function ProjectsChartCard({
  juniorId,
}: {
  juniorId?: number;
}) {
  const [data, setData] = useState<ApiData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/projects/stats${juniorId ? `?juniorId=${juniorId}` : ""}`
        );
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to load chart data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [juniorId]);

  const options: ApexCharts.ApexOptions = {
    chart: {
        type: "bar",
        height: 400,
        toolbar: { show: false },
        background: "#ffffff",
        },
    plotOptions: {
      bar: {
        horizontal: false, // set true if you want horizontal bars
        borderRadius: 6,
        columnWidth: "55%",
      },
    },
    grid: {
        borderColor: "#e5e7eb", // Tailwind gray-200
        strokeDashArray: 4,
        },
        xaxis: {
        categories: data.map(d => d.year.toString()),
        labels: {
            style: {
            colors: "#374151", // gray-700
            fontFamily: "Inter, sans-serif",
            },
        },
        },
        yaxis: {
        min: 0,
        tickAmount: Math.max(...data.map(d => d.count), 1),
        labels: {
            formatter: v => Math.round(v).toString(),
            style: {
            colors: "#374151",
            fontFamily: "Inter, sans-serif",
            },
        },
        },

    tooltip: {
      y: {
        formatter: value => `${value} projects`,
      },
    },
    colors: ["#f63b57"], // Tailwind blue-500
  };

  const series = [
    {
      name: "Projects",
      data: data.map(d => d.count),
    },
  ];

  return (
    <div className="max-w-sm w-full bg-white rounded-lg shadow-sm  p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between border-b border-gray-200  pb-3">
        <dl>
          <dt className="text-base font-normal text-gray-500 dark:text-gray-400 pb-1">
            Total Projects
          </dt>
          <dd className="leading-none text-3xl font-bold text-gray-900 dark:text-gray-400">
            {data.reduce((sum, d) => sum + d.count, 0)}
          </dd>
        </dl>
      </div>

      {/* Chart */}
      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading chart…
          </p>
        ) : (
          <Chart options={options} series={series} type="bar" height={400} />
        )}
      </div>
    </div>
  );
}
