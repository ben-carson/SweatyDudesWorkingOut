import MobileNavigation from '../MobileNavigation';

export default function MobileNavigationExample() {
  return (
    <div className="relative h-20 bg-muted/20 rounded-md">
      <div className="absolute bottom-0 left-0 right-0">
        <MobileNavigation currentPath="/friends" />
      </div>
    </div>
  );
}