import ProgressChart from '../ProgressChart';

export default function ProgressChartExample() {
  // Mock progress data
  const mockData = [
    { date: 'Jan 1', weight: 60, reps: 8, volume: 1920 },
    { date: 'Jan 8', weight: 62.5, reps: 8, volume: 2000 },
    { date: 'Jan 15', weight: 62.5, reps: 9, volume: 2250 },
    { date: 'Jan 22', weight: 65, reps: 8, volume: 2080 },
    { date: 'Jan 29', weight: 65, reps: 10, volume: 2600 },
    { date: 'Feb 5', weight: 67.5, reps: 8, volume: 2160 }
  ];

  return (
    <div className="grid gap-4 max-w-2xl">
      <ProgressChart 
        exercise="Bench Press" 
        data={mockData} 
        metric="weight" 
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProgressChart 
          exercise="Pull-ups" 
          data={mockData} 
          metric="reps" 
        />
        <ProgressChart 
          exercise="Deadlift" 
          data={mockData} 
          metric="volume" 
        />
      </div>
    </div>
  );
}