import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { Plus, Trophy, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Challenge {
  id: string;
  title: string;
  activity: string;
  metric: string;
  unit: string;
  startAt: string;
  endAt: string;
  createdBy: string;
  status: string;
}

interface LeaderboardEntry {
  user: {
    id: string;
    name: string;
    username: string;
  };
  total: number;
  rank: number;
  deltaFromLeader: number;
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/challenges", challenge.id, "leaderboard"],
  });

  const { data: participants } = useQuery<any[]>({
    queryKey: ["/api/challenges", challenge.id, "participants"],
  });

  const chartData = leaderboard?.slice(0, 5).map((entry, index) => ({
    name: entry.user.name.split(' ')[0], // First name only
    value: entry.total,
    isCurrentUser: entry.user.id === 'user1', // Mock current user
  })) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const currentUserEntry = leaderboard?.find(entry => entry.user.id === 'user1');
  const leader = leaderboard?.[0];

  return (
    <Card className="hover-elevate cursor-pointer" data-testid={`card-challenge-${challenge.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{challenge.title}</CardTitle>
          <Badge className={getStatusColor(challenge.status)} data-testid={`badge-status-${challenge.status}`}>
            {challenge.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span data-testid="text-participant-count">{participants?.length || 0} participants</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span data-testid="text-challenge-duration">
              {format(new Date(challenge.startAt), 'MMM d')} - {format(new Date(challenge.endAt), 'MMM d')}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {leaderboard && leaderboard.length > 0 ? (
          <>
            {/* Mini Bar Chart */}
            <div className="h-32 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis hide />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isCurrentUser ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Text Summary */}
            <div className="space-y-2" data-testid="text-challenge-summary">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-medium text-sm">
                  {leader?.user.name} leads with {leader?.total} {challenge.unit}
                </span>
              </div>
              {currentUserEntry && (
                <div className="text-sm text-muted-foreground">
                  You're #{currentUserEntry.rank} with {currentUserEntry.total} {challenge.unit}
                  {currentUserEntry.deltaFromLeader > 0 && (
                    <span className="text-orange-500">
                      {' '}({currentUserEntry.deltaFromLeader} behind leader)
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No entries yet - be the first to log progress!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ChallengesHome() {
  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges", "user1"], // Mock current user
    queryFn: async () => {
      const response = await fetch(`/api/challenges?userId=user1`);
      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }
      return response.json();
    },
  });

  const activeChallenges = challenges?.filter((c: Challenge) => c.status === 'active') || [];
  const upcomingChallenges = challenges?.filter((c: Challenge) => c.status === 'upcoming') || [];
  const completedChallenges = challenges?.filter((c: Challenge) => c.status === 'completed') || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-challenges">
              SweatyDudes Challenges
            </h1>
            <p className="text-muted-foreground mt-1">
              Compete with friends and track your fitness progress
            </p>
          </div>
          <Button 
            className="flex items-center gap-2"
            data-testid="button-create-challenge"
          >
            <Plus className="w-4 h-4" />
            New Challenge
          </Button>
        </div>

        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Active Challenges
            </h2>
            <div className="grid gap-4">
              {activeChallenges.map((challenge: Challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Challenges */}
        {upcomingChallenges.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              Upcoming Challenges
            </h2>
            <div className="grid gap-4">
              {upcomingChallenges.map((challenge: Challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </section>
        )}

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              Completed Challenges
            </h2>
            <div className="grid gap-4">
              {completedChallenges.map((challenge: Challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {(!challenges || (challenges as Challenge[]).length === 0) && (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No challenges yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first challenge to start competing with friends!
            </p>
            <Button className="flex items-center gap-2" data-testid="button-create-first-challenge">
              <Plus className="w-4 h-4" />
              Create Your First Challenge
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}