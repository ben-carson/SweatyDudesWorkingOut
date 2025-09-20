import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Trophy, Clock, Zap } from "lucide-react";
import { useState } from "react";

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
}

interface WorkoutCardProps {
  id: string;
  user: {
    name: string;
    avatar?: string;
    username: string;
  };
  title: string;
  exercises: Exercise[];
  duration: number; // in minutes
  timestamp: Date;
  likes: number;
  comments: number;
  isPR?: boolean;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
}

export default function WorkoutCard({
  user,
  title,
  exercises,
  duration,
  timestamp,
  likes,
  comments,
  isPR = false,
  isLiked = false,
  onLike,
  onComment
}: WorkoutCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    onLike?.();
    console.log('Workout liked/unliked');
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getTotalVolume = () => {
    return exercises.reduce((total, ex) => {
      const weight = ex.weight || 0;
      return total + (ex.sets * ex.reps * weight);
    }, 0);
  };

  return (
    <Card className="w-full hover-elevate">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPR && (
              <Badge variant="secondary" className="bg-chart-1 text-white">
                <Trophy className="w-3 h-3 mr-1" />
                PR
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatTime(timestamp)}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <h3 className="font-bold text-lg mb-3">{title}</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted rounded-md">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-mono font-semibold">{duration}m</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-mono font-semibold">{exercises.length}</p>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Trophy className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-mono font-semibold">{getTotalVolume()}kg</p>
            <p className="text-xs text-muted-foreground">Volume</p>
          </div>
        </div>

        <div className="space-y-2">
          {exercises.slice(0, 3).map((exercise, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-card rounded-md border">
              <span className="font-medium text-sm">{exercise.name}</span>
              <span className="text-sm font-mono text-muted-foreground">
                {exercise.sets} × {exercise.reps}
                {exercise.weight && ` @ ${exercise.weight}kg`}
              </span>
            </div>
          ))}
          {exercises.length > 3 && (
            <p className="text-xs text-muted-foreground text-center py-1">
              +{exercises.length - 3} more exercises
            </p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex items-center gap-4 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex items-center gap-2 ${liked ? 'text-red-500' : ''}`}
            data-testid="button-like-workout"
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            <span className="text-sm font-mono">{likeCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onComment?.();
              console.log('Comment on workout');
            }}
            className="flex items-center gap-2"
            data-testid="button-comment-workout"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-mono">{comments}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}