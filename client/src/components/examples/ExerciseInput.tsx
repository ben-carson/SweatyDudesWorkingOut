import ExerciseInput from '../ExerciseInput';
import { useState } from 'react';

export default function ExerciseInputExample() {
  const [exerciseCount, setExerciseCount] = useState(1);

  return (
    <div className="space-y-4 max-w-lg">
      <ExerciseInput 
        exerciseName="Bench Press" 
        onRemove={exerciseCount > 1 ? () => setExerciseCount(prev => prev - 1) : undefined}
      />
      {exerciseCount > 1 && (
        <ExerciseInput 
          exerciseName="Squats" 
          onRemove={() => setExerciseCount(prev => prev - 1)}
        />
      )}
    </div>
  );
}