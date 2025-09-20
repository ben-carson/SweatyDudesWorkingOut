import { Button } from "@/components/ui/button";
import { Plus, Dumbbell } from "lucide-react";
import { useState } from "react";

interface StartWorkoutButtonProps {
  onClick?: () => void;
  className?: string;
}

export default function StartWorkoutButton({ onClick, className = "" }: StartWorkoutButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    onClick?.();
    console.log('Start workout pressed');
  };

  return (
    <Button
      size="lg"
      onClick={handleClick}
      className={`bg-chart-1 hover:bg-chart-1/90 text-white font-semibold transition-all duration-200 ${isPressed ? 'scale-95' : ''} ${className}`}
      data-testid="button-start-workout"
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <Plus className="w-5 h-5" />
          <Dumbbell className="w-3 h-3 absolute -bottom-0.5 -right-0.5 opacity-60" />
        </div>
        Start Workout
      </div>
    </Button>
  );
}