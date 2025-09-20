import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2 } from "lucide-react";
import { useState } from "react";

interface Set {
  reps: number;
  weight: number;
  completed: boolean;
}

interface ExerciseInputProps {
  exerciseName: string;
  onRemove?: () => void;
  onChange?: (exerciseName: string, sets: Set[]) => void;
}

export default function ExerciseInput({ 
  exerciseName, 
  onRemove, 
  onChange 
}: ExerciseInputProps) {
  const [sets, setSets] = useState<Set[]>([
    { reps: 10, weight: 20, completed: false }
  ]);
  const [name, setName] = useState(exerciseName);

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    const newSet = { 
      reps: lastSet?.reps || 10, 
      weight: lastSet?.weight || 20, 
      completed: false 
    };
    const newSets = [...sets, newSet];
    setSets(newSets);
    onChange?.(name, newSets);
    console.log('Set added');
  };

  const removeSet = (index: number) => {
    const newSets = sets.filter((_, i) => i !== index);
    setSets(newSets);
    onChange?.(name, newSets);
    console.log('Set removed');
  };

  const updateSet = (index: number, field: keyof Set, value: number | boolean) => {
    const newSets = sets.map((set, i) => 
      i === index ? { ...set, [field]: value } : set
    );
    setSets(newSets);
    onChange?.(name, newSets);
  };

  const toggleSetComplete = (index: number) => {
    updateSet(index, 'completed', !sets[index].completed);
    console.log(`Set ${index + 1} ${sets[index].completed ? 'incomplete' : 'complete'}`);
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    onChange?.(newName, sets);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="exercise-name" className="text-sm font-medium">Exercise</Label>
            <Input
              id="exercise-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Bench Press"
              className="mt-1"
              data-testid="input-exercise-name"
            />
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onRemove();
                console.log('Exercise removed');
              }}
              className="text-muted-foreground hover:text-destructive mt-6"
              data-testid="button-remove-exercise"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {sets.map((set, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-md">
            <Badge variant="secondary" className="min-w-[2rem] text-center">
              {index + 1}
            </Badge>
            
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground min-w-[3rem]">Reps</Label>
              <Input
                type="number"
                value={set.reps}
                onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
                className="w-16 h-8 text-center font-mono"
                min="0"
                data-testid={`input-reps-${index}`}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground min-w-[3rem]">Weight</Label>
              <Input
                type="number"
                value={set.weight}
                onChange={(e) => updateSet(index, 'weight', parseFloat(e.target.value) || 0)}
                className="w-16 h-8 text-center font-mono"
                min="0"
                step="0.5"
                data-testid={`input-weight-${index}`}
              />
              <span className="text-xs text-muted-foreground">kg</span>
            </div>
            
            <Button
              variant={set.completed ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSetComplete(index)}
              className={`ml-auto ${set.completed ? 'bg-chart-1 text-white' : ''}`}
              data-testid={`button-complete-set-${index}`}
            >
              {set.completed ? '✓' : '○'}
            </Button>
            
            {sets.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSet(index)}
                className="text-muted-foreground hover:text-destructive h-8 w-8"
                data-testid={`button-remove-set-${index}`}
              >
                <Minus className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        
        <Button
          variant="outline"
          onClick={addSet}
          className="w-full"
          data-testid="button-add-set"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Set
        </Button>
      </CardContent>
    </Card>
  );
}