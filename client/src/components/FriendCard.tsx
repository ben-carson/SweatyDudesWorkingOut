import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserCheck, Trophy, Zap } from "lucide-react";
import { useState } from "react";

interface FriendCardProps {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isFollowing?: boolean;
  workoutsThisWeek: number;
  currentStreak: number;
  totalWorkouts: number;
  onFollowToggle?: (id: string, isFollowing: boolean) => void;
}

export default function FriendCard({
  id,
  name,
  username,
  avatar,
  isFollowing = false,
  workoutsThisWeek,
  currentStreak,
  totalWorkouts,
  onFollowToggle
}: FriendCardProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowToggle = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setFollowing(!following);
      setIsLoading(false);
      onFollowToggle?.(id, !following);
      console.log(`${following ? 'Unfollowed' : 'Followed'} ${name}`);
    }, 500);
  };

  return (
    <Card className="w-full hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-base">{name}</h3>
              <p className="text-sm text-muted-foreground">@{username}</p>
            </div>
          </div>
          
          <Button
            variant={following ? "outline" : "default"}
            size="sm"
            onClick={handleFollowToggle}
            disabled={isLoading}
            className={`flex items-center gap-1 ${following ? '' : 'bg-chart-1 hover:bg-chart-1/90 text-white'}`}
            data-testid={`button-follow-${id}`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : following ? (
              <>
                <UserCheck className="w-4 h-4" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Follow
              </>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-muted rounded-md">
            <div className="flex items-center justify-center mb-1">
              <Zap className="w-4 h-4 text-chart-2" />
            </div>
            <p className="text-lg font-bold font-mono">{workoutsThisWeek}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          
          <div className="text-center p-2 bg-muted rounded-md">
            <div className="flex items-center justify-center mb-1">
              <Trophy className="w-4 h-4 text-chart-1" />
            </div>
            <p className="text-lg font-bold font-mono">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          
          <div className="text-center p-2 bg-muted rounded-md">
            <div className="flex items-center justify-center mb-1">
              <Trophy className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold font-mono">{totalWorkouts}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
        
        {currentStreak >= 7 && (
          <Badge variant="secondary" className="w-full mt-3 bg-chart-1/10 text-chart-1 border-chart-1/20">
            <Trophy className="w-3 h-3 mr-1" />
            On Fire! 🔥
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}