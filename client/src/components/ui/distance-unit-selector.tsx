import { useDistanceUnit } from '../../hooks/use-distance-unit';

export function DistanceUnitSelector() {
  const { distanceUnit, setDistanceUnit } = useDistanceUnit();

  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={() => setDistanceUnit('km')}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          distanceUnit === 'km'
            ? 'bg-gray-900 text-white text-xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
        data-testid="button-distance-km"
      >
        km
      </button>
      <span className="text-xs text-gray-400">|</span>
      <button
        onClick={() => setDistanceUnit('miles')}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          distanceUnit === 'miles'
            ? 'bg-gray-900 text-white text-xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
        data-testid="button-distance-mile"
      >
        mile
      </button>
    </div>
  );
}
