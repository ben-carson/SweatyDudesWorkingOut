import WorkoutCard from '../WorkoutCard';

export default function WorkoutCardExample() {
  // Mock data for demonstration
  const mockWorkout = {
    id: '1',
    user: {
      name: 'Sarah Johnson',
      username: 'sarahfit',
      avatar: undefined // Will use fallback initials
    },
    title: 'Upper Body Strength',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, weight: 60 },
      { name: 'Pull-ups', sets: 3, reps: 12, weight: undefined },
      { name: 'Overhead Press', sets: 3, reps: 10, weight: 40 },
      { name: 'Rows', sets: 3, reps: 10, weight: 50 }
    ],
    duration: 45,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    likes: 12,
    comments: 3,
    isPR: true,
    isLiked: false
  };

  return (
    <div className="max-w-md">
      <WorkoutCard {...mockWorkout} />
    </div>
  );
}