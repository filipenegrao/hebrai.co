import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyStats } from "@/lib/api";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  stats: DailyStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        title="Sequência"
        value={stats.streak_days}
        subtitle={stats.streak_days === 1 ? "dia" : "dias"}
      />
      <StatCard title="Revisões hoje" value={stats.reviews_today} />
      <StatCard title="Palavras novas" value={stats.new_words_today} subtitle="hoje" />
      <StatCard
        title="Retenção"
        value={`${stats.retention_rate.toFixed(0)}%`}
        subtitle="últimos 30 dias"
      />
    </div>
  );
}
