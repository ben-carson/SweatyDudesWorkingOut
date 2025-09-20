import { useState } from 'react';
import ProgressChart from '@/components/ProgressChart';
import StatsCard from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dumbbell, Target, Zap, Trophy, TrendingUp, Calendar } from 'lucide-react';

export default function Progress() {
  // Todo: remove mock functionality - replace with real API calls
  const [selectedTimeframe, setSelectedTimeframe] = useState('3months');
  const [selectedExercise, setSelectedExercise] = useState('bench-press');

  // Mock progress data
  const mockProgressData = {
    'bench-press': {
      name: 'Bench Press',
      data: [
        { date: 'Jan 1', weight: 60, reps: 8, volume: 1920 },
        { date: 'Jan 8', weight: 62.5, reps: 8, volume: 2000 },
        { date: 'Jan 15', weight: 62.5, reps: 9, volume: 2250 },
        { date: 'Jan 22', weight: 65, reps: 8, volume: 2080 },
        { date: 'Jan 29', weight: 65, reps: 10, volume: 2600 },
        { date: 'Feb 5', weight: 67.5, reps: 8, volume: 2160 },
        { date: 'Feb 12', weight: 70, reps: 8, volume: 2240 }
      ]
    },
    'squats': {
      name: 'Squats',
      data: [
        { date: 'Jan 1', weight: 80, reps: 10, volume: 2400 },
        { date: 'Jan 8', weight: 82.5, reps: 10, volume: 2475 },
        { date: 'Jan 15', weight: 85, reps: 8, volume: 2040 },
        { date: 'Jan 22', weight: 87.5, reps: 8, volume: 2100 },
        { date: 'Jan 29', weight: 90, reps: 6, volume: 1620 },
        { date: 'Feb 5', weight: 90, reps: 8, volume: 2160 },
        { date: 'Feb 12', weight: 92.5, reps: 8, volume: 2220 }
      ]
    },
    'deadlift': {
      name: 'Deadlift',
      data: [
        { date: 'Jan 1', weight: 100, reps: 5, volume: 1500 },
        { date: 'Jan 8', weight: 102.5, reps: 5, volume: 1537 },
        { date: 'Jan 15', weight: 105, reps: 4, volume: 1260 },
        { date: 'Jan 22', weight: 107.5, reps: 4, volume: 1290 },
        { date: 'Jan 29', weight: 110, reps: 3, volume: 990 },
        { date: 'Feb 5', weight: 110, reps: 5, volume: 1650 },
        { date: 'Feb 12', weight: 112.5, reps: 5, volume: 1687 }
      ]
    }
  };

  const currentExercise = mockProgressData[selectedExercise as keyof typeof mockProgressData];

  // Mock recent achievements
  const recentAchievements = [
    { exercise: 'Bench Press', achievement: 'New 1RM: 70kg', date: '2 days ago', type: 'PR' },
    { exercise: 'Squats', achievement: '5 workouts this week', date: '3 days ago', type: 'Consistency' },
    { exercise: 'Pull-ups', achievement: 'First unassisted set', date: '1 week ago', type: 'Milestone' }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Progress Tracking</h1>
          <p className="text-muted-foreground">Monitor your strength gains and workout consistency</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            trend={{ value: 4.2, isPositive: true }}
          />
        </div>

        {/* Exercise Progress Chart */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Exercise Progress
              </CardTitle>
              <div className="flex gap-3">
                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                  <SelectTrigger className="w-40" data-testid="select-exercise">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bench-press">Bench Press</SelectItem>
                    <SelectItem value="squats">Squats</SelectItem>
                    <SelectItem value="deadlift">Deadlift</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger className="w-32" data-testid="select-timeframe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">1 Month</SelectItem>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ProgressChart 
                exercise={currentExercise.name}
                data={currentExercise.data}
                metric="weight"
              />
              <ProgressChart 
                exercise={currentExercise.name}
                data={currentExercise.data}
                metric="reps"
              />
              <ProgressChart 
                exercise={currentExercise.name}
                data={currentExercise.data}
                metric="volume"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAchievements.map((achievement, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md hover-elevate">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-chart-1 rounded-full" />
                    <div>
                      <p className="font-medium text-sm">{achievement.exercise}</p>
                      <p className="text-sm text-muted-foreground">{achievement.achievement}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="secondary" 
                      className={`mb-1 ${
                        achievement.type === 'PR' 
                          ? 'bg-chart-1/10 text-chart-1' 
                          : achievement.type === 'Consistency'
                          ? 'bg-chart-2/10 text-chart-2'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {achievement.type}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{achievement.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => console.log('View all achievements')}
              data-testid="button-view-all-achievements"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View All Achievements
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}