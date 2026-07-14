import { Suspense } from "react";
import DashboardEngine from "@/components/dashboard-engine";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f172a]">
      <Suspense fallback={null}>
        <DashboardEngine />
      </Suspense>
    </main>
  );
}
