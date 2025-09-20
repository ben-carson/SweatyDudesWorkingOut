import FriendCard from '../FriendCard';

export default function FriendCardExample() {
  const mockFriends = [
    {
      id: '1',
      name: 'Alex Chen',
      username: 'alexfit',
      workoutsThisWeek: 4,
      currentStreak: 12,
      totalWorkouts: 156,
      isFollowing: false
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

  return (
    <div className="grid gap-4 max-w-sm">
      {mockFriends.map(friend => (
        <FriendCard key={friend.id} {...friend} />
      ))}
    </div>
  );
}