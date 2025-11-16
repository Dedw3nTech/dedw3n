import { useDimensionUnit } from '../../hooks/use-dimension-unit';

export function DimensionUnitSelector() {
  const { dimensionUnit, setDimensionUnit } = useDimensionUnit();

  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={() => setDimensionUnit('cm')}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          dimensionUnit === 'cm'
            ? 'bg-gray-900 text-white text-xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        cm
      </button>
      <span className="text-xs text-gray-400">|</span>
      <button
        onClick={() => setDimensionUnit('inches')}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          dimensionUnit === 'inches'
            ? 'bg-gray-900 text-white text-xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        inch
      </button>
    </div>
  );
}