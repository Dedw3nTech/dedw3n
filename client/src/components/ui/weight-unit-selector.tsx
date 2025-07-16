import { useWeightUnit, WeightUnit } from '@/contexts/WeightUnitContext';

export function WeightUnitSelector() {
  const { weightUnit, setWeightUnit } = useWeightUnit();

  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={() => setWeightUnit('kg')}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          weightUnit === 'kg'
            ? 'bg-gray-900 text-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        KG
      </button>
      <span className="text-xs text-gray-400">|</span>
      <button
        onClick={() => setWeightUnit('lbs')}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          weightUnit === 'lbs'
            ? 'bg-gray-900 text-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        LBS
      </button>
    </div>
  );
}