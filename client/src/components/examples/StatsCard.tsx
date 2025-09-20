import StatsCard from '../StatsCard';
import { Dumbbell, Target, Zap, Trophy } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
      <StatsCard
        title="Total Workouts"
        value={87}
        subtitle="This month"
        icon={Dumbbell}
        trend={{ value: 12.5, isPositive: true }}
      />
      <StatsCard
        title="Current Streak"
        value="15 days"
        subtitle="Personal best!"
        icon={Target}
        trend={{ value: 8.3, isPositive: true }}
      />
      <StatsCard
        title="Weekly Goal"
        value="4/5"
        subtitle="80% complete"
        icon={Zap}
      />
      <StatsCard
        title="Personal Records"
        value={23}
        subtitle="All time"
        icon={Trophy}
        trend={{ value: -2.1, isPositive: false }}
      />
    </div>
  );
}