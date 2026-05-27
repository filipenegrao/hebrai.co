import { LumenMetricCard } from "@/components/LumenChrome";
import type { DailyStats } from "@/lib/api";

interface DashboardStatsProps {
  stats: DailyStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <LumenMetricCard
        title="Sequência"
        value={stats.streak_days}
        subtitle={stats.streak_days === 1 ? "dia" : "dias"}
        accent
      />
      <LumenMetricCard title="Revisões hoje" value={stats.reviews_today} subtitle="cartas devidas" />
      <LumenMetricCard title="Palavras novas" value={stats.new_words_today} subtitle="a estudar hoje" />
      <LumenMetricCard
        title="Retenção"
        value={`${stats.retention_rate.toFixed(0)}%`}
        subtitle="últimos 30 dias"
        accent
      />
    </div>
  );
}
