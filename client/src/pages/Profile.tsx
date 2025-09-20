import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Trophy, Zap, Target, Calendar, Edit, Share } from 'lucide-react';
import WorkoutCard from '@/components/WorkoutCard';

export default function Profile() {
  // Todo: remove mock functionality - replace with real API calls
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userName, setUserName] = useState('John Smith');
  const [userBio, setUserBio] = useState('Fitness enthusiast | Powerlifter | Always pushing limits');

  // Mock user data
  const userData = {
    name: userName,
    username: 'johnsmith_fit',
    bio: userBio,
    avatar: undefined, // Will use fallback
    memberSince: 'January 2024',
    stats: {
      totalWorkouts: 156,
      currentStreak: 15,
      personalRecords: 23,
      weeklyGoal: 5,
      completedThisWeek: 4
    },
    achievements: [
      { name: '30-Day Streak', icon: Target, earned: true, date: '2024-01-15' },
      { name: '100 Workouts', icon: Trophy, earned: true, date: '2024-02-01' },
      { name: 'PR Master', icon: Zap, earned: true, date: '2024-02-10' },
      { name: '6-Month Streak', icon: Calendar, earned: false, date: null }
    ]
  };

  // Mock recent workouts
  const recentWorkouts = [
    {
      id: '1',
      user: {
        name: userData.name,
        username: userData.username,
        avatar: userData.avatar
      },
      title: 'Push Day - Heavy',
      exercises: [
        { name: 'Bench Press', sets: 5, reps: 5, weight: 70 },
        { name: 'Overhead Press', sets: 4, reps: 6, weight: 45 },
        { name: 'Dips', sets: 3, reps: 12, weight: undefined }
      ],
      duration: 50,
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      likes: 18,
      comments: 4,
      isPR: true,
      isLiked: true
    },
    {
      id: '2',
      user: {
        name: userData.name,
        username: userData.username,
        avatar: userData.avatar
      },
      title: 'Pull Day Recovery',
      exercises: [
        { name: 'Pull-ups', sets: 4, reps: 8, weight: undefined },
        { name: 'Rows', sets: 4, reps: 10, weight: 55 },
        { name: 'Face Pulls', sets: 3, reps: 15, weight: 15 }
      ],
      duration: 40,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      likes: 12,
      comments: 2,
      isPR: false,
      isLiked: false
    }
  ];

  const handleSaveProfile = () => {
    setIsEditOpen(false);
    console.log('Profile updated:', { name: userName, bio: userBio });
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
                  <AvatarImage src={userData.avatar} alt={userData.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold">{userData.name}</h1>
                  <p className="text-muted-foreground">@{userData.username}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Member since {userData.memberSince}
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
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          data-testid="input-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Input
                          id="bio"
                          value={userBio}
                          onChange={(e) => setUserBio(e.target.value)}
                          placeholder="Tell us about your fitness journey..."
                          data-testid="input-bio"
                        />
                      </div>
                      <Button 
                        onClick={handleSaveProfile}
                        className="w-full bg-chart-1 hover:bg-chart-1/90 text-white"
                        data-testid="button-save-profile"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <p className="text-sm mb-4">{userData.bio}</p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-md">
                <div className="flex items-center justify-center mb-1">
                  <Trophy className="w-4 h-4 text-chart-1" />
                </div>
                <p className="text-lg font-bold font-mono">{userData.stats.totalWorkouts}</p>
                <p className="text-xs text-muted-foreground">Workouts</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-md">
                <div className="flex items-center justify-center mb-1">
                  <Target className="w-4 h-4 text-chart-2" />
                </div>
                <p className="text-lg font-bold font-mono">{userData.stats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-md">
                <div className="flex items-center justify-center mb-1">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <p className="text-lg font-bold font-mono">{userData.stats.personalRecords}</p>
                <p className="text-xs text-muted-foreground">PRs</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-md">
                <div className="flex items-center justify-center mb-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-lg font-bold font-mono">
                  {userData.stats.completedThisWeek}/{userData.stats.weeklyGoal}
                </p>
                <p className="text-xs text-muted-foreground">Weekly Goal</p>
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
            <div className="grid grid-cols-2 gap-3">
              {userData.achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <div 
                    key={index} 
                    className={`p-3 rounded-md border-2 transition-colors ${
                      achievement.earned 
                        ? 'border-chart-1/20 bg-chart-1/5'
                        : 'border-dashed border-muted-foreground/20 bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${
                        achievement.earned ? 'text-chart-1' : 'text-muted-foreground'
                      }`} />
                      <span className={`text-sm font-medium ${
                        achievement.earned ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {achievement.name}
                      </span>
                    </div>
                    {achievement.earned && achievement.date && (
                      <p className="text-xs text-muted-foreground">
                        Earned {new Date(achievement.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Workouts */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
            Recent Workouts
            <Badge variant="secondary">{recentWorkouts.length}</Badge>
          </h2>
          <div className="space-y-4">
            {recentWorkouts.map((workout) => (
              <WorkoutCard key={workout.id} {...workout} />
            ))}
          </div>
        </div>

        {/* Settings Button */}
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2"
          onClick={() => console.log('Open settings')}
          data-testid="button-settings"
        >
          <Settings className="w-4 h-4" />
          Settings & Privacy
        </Button>
      </div>
    </div>
  );
}