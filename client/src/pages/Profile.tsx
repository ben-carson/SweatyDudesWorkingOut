import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Trophy, Zap, Target, Calendar, Edit, Share, Dumbbell } from 'lucide-react';
import { stackClientApp } from '@/stack';
import type { WorkoutSession, WorkoutSet, Exercise, User } from '@shared/schema';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

export default function Profile() {
  const user = stackClientApp.useUser();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  if (!user) {
    return null;
  }

  const userId = user.id;

  // Fetch user data from database
  const { data: dbUser } = useQuery<User>({
    queryKey: ["/api/users", userId],
  });

  useEffect(() => {
    // Initialize from Stack Auth user object and clientMetadata
    const metadata = user.clientMetadata as { firstName?: string; lastName?: string } | undefined;
    setFirstName(metadata?.firstName || '');
    setLastName(metadata?.lastName || '');
    setEmail(user.primaryEmail || '');
    setUsername(dbUser?.username || '');
  }, [user, dbUser]);

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: { firstName?: string; lastName?: string; username?: string }) => {
      // Update Stack Auth user with name in metadata and displayName
      await user.update({
        displayName: updates.firstName && updates.lastName 
          ? `${updates.firstName} ${updates.lastName}` 
          : user.displayName || undefined,
        clientMetadata: {
          firstName: updates.firstName || '',
          lastName: updates.lastName || '',
        }
      });

      // Update username in local database (Stack Auth doesn't support username)
      if (updates.username) {
        const response = await apiRequest('PATCH', `/api/users/${userId}`, {
          username: updates.username
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      setIsEditOpen(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Fetch recent workout sessions (same as Workouts tab)
  const { data: recentSessions = [], isLoading: isLoadingSessions } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/workouts/sessions", userId],
    queryFn: async () => {
      const response = await fetch(`/api/workouts/sessions?userId=${userId}&limit=5`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    }
  });

  // Fetch all sessions for stats calculation
  const { data: allSessions = [] } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/workouts/sessions/all", userId],
    queryFn: async () => {
      const response = await fetch(`/api/workouts/sessions?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch all sessions');
      return response.json();
    }
  });

  // Fetch exercises for displaying session details
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  // Fetch sets for recent sessions to display details
  const { data: allSets = [] } = useQuery<WorkoutSet[]>({
    queryKey: ["/api/workouts/sets/recent", userId],
    queryFn: async () => {
      if (recentSessions.length === 0) return [];
      
      const sessionIds = recentSessions.map(s => s.id);
      const setsPromises = sessionIds.map(sessionId =>
        fetch(`/api/workouts/sessions/${sessionId}/sets?userId=${userId}`)
          .then(res => res.ok ? res.json() : [])
      );
      
      const setsArrays = await Promise.all(setsPromises);
      return setsArrays.flat();
    },
    enabled: recentSessions.length > 0
  });

  // Calculate stats from real data
  const totalWorkouts = allSessions.filter(s => s.endedAt).length;
  const completedThisWeek = allSessions.filter(s => {
    if (!s.endedAt) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(s.endedAt) >= weekAgo;
  }).length;

  // Get user data - prefer Stack Auth values
  const metadata = user.clientMetadata as { firstName?: string; lastName?: string } | undefined;
  const displayName = metadata?.firstName && metadata?.lastName 
    ? `${metadata.firstName} ${metadata.lastName}`
    : metadata?.firstName || metadata?.lastName || user.displayName || user.primaryEmail?.split('@')[0] || 'User';
  const displayUsername = dbUser?.username || user.primaryEmail?.split('@')[0] || 'user';
  const memberSince = 'Recently'; // Stack Auth user object doesn't expose createdAt directly
  const profileImageUrl = user.profileImageUrl;

  const handleSaveProfile = () => {
    updateMutation.mutate({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      username: username || undefined,
    });
  };

  // Group sets by session for display
  const sessionsWithDetails = recentSessions.map(session => {
    const sessionSets = allSets.filter(set => set.sessionId === session.id);
    
    // Group sets by exercise
    const exerciseGroups = sessionSets.reduce((acc, set) => {
      const exercise = exercises.find(ex => ex.id === set.exerciseId);
      if (!exercise) return acc;
      
      if (!acc[exercise.name]) {
        acc[exercise.name] = [];
      }
      acc[exercise.name].push(set);
      return acc;
    }, {} as Record<string, WorkoutSet[]>);

    return {
      session,
      exerciseGroups
    };
  });

  const handleSignOut = () => {
    stackClientApp.redirectToSignOut();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileImageUrl || undefined} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold" data-testid="text-user-name">{displayName}</h1>
                  <p className="text-muted-foreground" data-testid="text-username">@{displayUsername}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Member since {memberSince}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => console.log('Share profile')}
                  data-testid="button-share-profile"
                >
                  <Share className="w-4 h-4" />
                </Button>
                
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      data-testid="button-edit-profile"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First name"
                            data-testid="input-first-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last name"
                            data-testid="input-last-name"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Username"
                          data-testid="input-username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          readOnly
                          disabled
                          className="bg-muted"
                          data-testid="input-email"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Email is managed by your authentication provider
                        </p>
                      </div>
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={updateMutation.isPending}
                        className="w-full bg-chart-1 hover:bg-chart-1/90 text-white"
                        data-testid="button-save-profile"
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-md">
                <div className="flex items-center justify-center mb-1">
                  <Trophy className="w-4 h-4 text-chart-1" />
                </div>
                <p className="text-lg font-bold font-mono" data-testid="text-total-workouts">{totalWorkouts}</p>
                <p className="text-xs text-muted-foreground">Workouts</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-md">
                <div className="flex items-center justify-center mb-1">
                  <Target className="w-4 h-4 text-chart-2" />
                </div>
                <p className="text-lg font-bold font-mono">-</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-md">
                <div className="flex items-center justify-center mb-1">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <p className="text-lg font-bold font-mono">-</p>
                <p className="text-xs text-muted-foreground">PRs</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-md">
                <div className="flex items-center justify-center mb-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-lg font-bold font-mono" data-testid="text-weekly-workouts">
                  {completedThisWeek}
                </p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Keep working out to unlock achievements!</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Workouts */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
            Recent Sessions
            <Badge variant="secondary" data-testid="badge-session-count">{recentSessions.length}</Badge>
          </h2>
          
          {isLoadingSessions ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">Loading sessions...</p>
            </Card>
          ) : sessionsWithDetails.length === 0 ? (
            <Card className="p-6">
              <div className="text-center py-4 text-muted-foreground">
                <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No workout sessions yet. Start your first workout!</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessionsWithDetails.map(({ session, exerciseGroups }) => (
                <Card key={session.id} data-testid={`card-session-${session.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium" data-testid={`text-session-date-${session.id}`}>
                          {format(new Date(session.startedAt), 'MMM d, yyyy • h:mm a')}
                          {!session.endedAt && (
                            <Badge variant="default" className="ml-2">Active</Badge>
                          )}
                        </p>
                        {session.note && (
                          <p className="text-sm text-muted-foreground mt-1">{session.note}</p>
                        )}
                      </div>
                    </div>
                    
                    {Object.keys(exerciseGroups).length > 0 && (
                      <div className="mt-3 space-y-2">
                        {Object.entries(exerciseGroups).map(([exerciseName, sets]) => (
                          <div key={exerciseName} className="text-sm">
                            <span className="font-medium">{exerciseName}</span>
                            <span className="text-muted-foreground ml-2">
                              {sets.length} {sets.length === 1 ? 'set' : 'sets'}
                              {sets[0].reps && ` • ${sets.map(s => s.reps).join(', ')} reps`}
                              {sets[0].weight && ` • ${sets.map(s => s.weight).join(', ')} lbs`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Settings & Sign Out */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2"
            onClick={() => setLocation('/settings')}
            data-testid="button-settings"
          >
            <Settings className="w-4 h-4" />
            Settings & Privacy
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleSignOut}
            data-testid="button-sign-out"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
