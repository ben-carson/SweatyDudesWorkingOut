import { useState } from 'react';
import FriendCard from '@/components/FriendCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Users, Trophy } from 'lucide-react';

export default function Friends() {
  // Todo: remove mock functionality - replace with real API calls
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'following' | 'discover'>('following');

  // Mock friends data
  const mockFriends = [
    {
      id: '1',
      name: 'Alex Chen',
      username: 'alexfit',
      workoutsThisWeek: 4,
      currentStreak: 12,
      totalWorkouts: 156,
      isFollowing: true
    },
    {
      id: '2', 
      name: 'Maria Rodriguez',
      username: 'maria_strong',
      workoutsThisWeek: 3,
      currentStreak: 5,
      totalWorkouts: 89,
      isFollowing: true
    },
    {
      id: '3',
      name: 'David Kim',
      username: 'davidlifts',
      workoutsThisWeek: 6,
      currentStreak: 23,
      totalWorkouts: 234,
      isFollowing: true
    }
  ];

  const mockDiscoverUsers = [
    {
      id: '4',
      name: 'Jessica Liu',
      username: 'jessfit',
      workoutsThisWeek: 5,
      currentStreak: 8,
      totalWorkouts: 67,
      isFollowing: false
    },
    {
      id: '5',
      name: 'Mike Johnson',
      username: 'mikegains',
      workoutsThisWeek: 7,
      currentStreak: 15,
      totalWorkouts: 198,
      isFollowing: false
    },
    {
      id: '6',
      name: 'Emma Wilson',
      username: 'emmawellness',
      workoutsThisWeek: 2,
      currentStreak: 3,
      totalWorkouts: 45,
      isFollowing: false
    }
  ];

  const currentData = activeTab === 'following' ? mockFriends : mockDiscoverUsers;
  const filteredFriends = currentData.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Friends</h1>
          <p className="text-muted-foreground">Connect with workout buddies and stay motivated together</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="hover-elevate">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-chart-1" />
              </div>
              <p className="text-2xl font-bold font-mono">{mockFriends.length}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-chart-2" />
              </div>
              <p className="text-2xl font-bold font-mono">
                {Math.max(...mockFriends.map(f => f.currentStreak))}
              </p>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-friends"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'following' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('following')}
            className={`flex items-center gap-2 ${activeTab === 'following' ? 'bg-chart-1 text-white hover:bg-chart-1/90' : ''}`}
            data-testid="tab-following"
          >
            <Users className="w-4 h-4" />
            Following
            <Badge variant="secondary" className="ml-1">
              {mockFriends.length}
            </Badge>
          </Button>
          <Button
            variant={activeTab === 'discover' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('discover')}
            className={`flex items-center gap-2 ${activeTab === 'discover' ? 'bg-chart-1 text-white hover:bg-chart-1/90' : ''}`}
            data-testid="tab-discover"
          >
            <UserPlus className="w-4 h-4" />
            Discover
            <Badge variant="secondary" className="ml-1">
              {mockDiscoverUsers.length}
            </Badge>
          </Button>
        </div>

        {/* Friends List */}
        <div className="space-y-4">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'No friends match your search.'
                  : activeTab === 'following' 
                  ? 'You\'re not following anyone yet.'
                  : 'No new users to discover.'
                }
              </p>
              {activeTab === 'following' && !searchQuery && (
                <Button 
                  onClick={() => setActiveTab('discover')}
                  className="bg-chart-1 hover:bg-chart-1/90 text-white"
                  data-testid="button-discover-friends"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Discover Friends
                </Button>
              )}
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <FriendCard 
                key={friend.id} 
                {...friend}
                onFollowToggle={(id, isFollowing) => {
                  console.log(`Friend ${id} ${isFollowing ? 'followed' : 'unfollowed'}`);
                }}
              />
            ))
          )}
        </div>

        {/* Workout Comparison Hint */}
        {activeTab === 'following' && mockFriends.length > 0 && (
          <Card className="mt-6 bg-chart-1/5 border-chart-1/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-chart-1" />
                Compare Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                See how your progress stacks up against your friends. Compare reps, weights, and personal records!
              </p>
              <Button 
                variant="outline" 
                className="border-chart-1/20 text-chart-1 hover:bg-chart-1/10"
                onClick={() => console.log('View comparisons')}
                data-testid="button-view-comparisons"
              >
                View Comparisons
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}