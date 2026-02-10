import FeedbackStatsCard from "../components/AvgNote";
import ProjectsChartCard from "../components/projByYear";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-8">
      <h1 className="text-4xl font-bold mb-6 text-heading">Feedback Dashboard</h1>

      <FeedbackStatsCard />
        <div className="mt-8 w-full max-w-4xl">
            <ProjectsChartCard />
        </div>
    </main>
  );
}
