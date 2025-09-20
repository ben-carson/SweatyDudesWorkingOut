import StartWorkoutButton from '../StartWorkoutButton';

export default function StartWorkoutButtonExample() {
  return (
    <div className="flex flex-col gap-4 items-center">
      <StartWorkoutButton />
      <StartWorkoutButton className="w-full" />
    </div>
  );
}