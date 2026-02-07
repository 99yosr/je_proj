"use client";

import { useEffect, useState } from "react";

type StatsResponse = {
  global: {
    average: number;
    count: number;
  };
  projects: {
    overallAverage: number;
    totalCount: number;
  };
  events: {
    overallAverage: number;
    totalCount: number;
  };
};

export default function FeedbackStatsCard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/getFeedback/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const json = await res.json();
        setStats(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-neutral-primary-soft max-w-sm p-6 border border-default rounded-base shadow-xs">
        <p className="text-body">Loading stats…</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <a
      href="#"
      className="bg-neutral-primary-soft block max-w-sm p-6 border border-default rounded-base shadow-xs hover:bg-neutral-secondary-medium transition"
    >
      <h5 className="mb-3 text-2xl font-semibold tracking-tight text-heading leading-8">
        Feedback Overview
      </h5>

      <p className="text-4xl font-bold text-heading mb-2">
        ⭐ {stats.global.average}
      </p>

      <p className="text-body mb-4">
        Based on {stats.global.count} feedback entries
      </p>

      <div className="space-y-1 text-sm text-body">
        <p>
          📁 Projects avg:{" "}
          <span className="font-medium">
            {stats.projects.overallAverage}
          </span>
        </p>
        <p>
          📅 Events avg:{" "}
          <span className="font-medium">
            {stats.events.overallAverage}
          </span>
        </p>
      </div>
    </a>
  );
}
