import { useState } from 'react';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';

export default function PercentageCalculator() {
  const [calc1X, setCalc1X] = useState('');
  const [calc1Y, setCalc1Y] = useState('');
  const [result1, setResult1] = useState<number | null>(null);

  const [calc2X, setCalc2X] = useState('');
  const [calc2Y, setCalc2Y] = useState('');
  const [result2, setResult2] = useState<number | null>(null);

  const [calc3From, setCalc3From] = useState('');
  const [calc3To, setCalc3To] = useState('');
  const [result3, setResult3] = useState<{ percentage: number; isIncrease: boolean } | null>(null);

  const texts = [
    'Percentage Calculator',
    'What is',
    '% of',
    '?',
    'Calculate',
    'is what percent of',
    'What is the percentage increase/decrease from',
    'to',
    '%',
    'Result',
    'increase',
    'decrease'
  ];

  const { translations } = useMasterBatchTranslation(texts);
  const [
    titleText,
    whatIsText,
    percentOfText,
    questionMarkText,
    calculateText,
    isWhatPercentText,
    percentageIncreaseDecreaseText,
    toText,
    percentSymbolText,
    resultText,
    increaseText,
    decreaseText
  ] = translations || texts;

  const calculate1 = () => {
    const x = parseFloat(calc1X);
    const y = parseFloat(calc1Y);
    if (!isNaN(x) && !isNaN(y)) {
      setResult1((x / 100) * y);
    }
  };

  const calculate2 = () => {
    const x = parseFloat(calc2X);
    const y = parseFloat(calc2Y);
    if (!isNaN(x) && !isNaN(y) && y !== 0) {
      setResult2((x / y) * 100);
    }
  };

  const calculate3 = () => {
    const from = parseFloat(calc3From);
    const to = parseFloat(calc3To);
    if (!isNaN(from) && !isNaN(to) && from !== 0) {
      const percentage = ((to - from) / Math.abs(from)) * 100;
      setResult3({
        percentage: Math.abs(percentage),
        isIncrease: percentage > 0
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-normal text-black mb-12 text-center">{titleText}</h1>

        <div className="space-y-10">
          <div className="border-b border-gray-200 pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-black">{whatIsText}</span>
              <input
                type="number"
                value={calc1X}
                onChange={(e) => setCalc1X(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculate1();
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('calc1Y')?.focus();
                  }
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="10"
                data-testid="input-calc1-x"
              />
              <span className="text-black">{percentOfText}</span>
              <input
                id="calc1Y"
                type="number"
                value={calc1Y}
                onChange={(e) => setCalc1Y(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculate1();
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="100"
                data-testid="input-calc1-y"
              />
              <span className="text-black">{questionMarkText}</span>
              <button 
                onClick={calculate1}
                className="px-6 py-2 bg-black text-white hover:bg-gray-800"
                data-testid="button-calculate-1"
              >
                {calculateText}
              </button>
              {result1 !== null && (
                <div className="px-3 py-2 border border-gray-300 text-black bg-white" data-testid="result-1">
                  {resultText}: {result1.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-gray-200 pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                value={calc2X}
                onChange={(e) => setCalc2X(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculate2();
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('calc2Y')?.focus();
                  }
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="10"
                data-testid="input-calc2-x"
              />
              <span className="text-black">{isWhatPercentText}</span>
              <input
                id="calc2Y"
                type="number"
                value={calc2Y}
                onChange={(e) => setCalc2Y(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculate2();
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="100"
                data-testid="input-calc2-y"
              />
              <span className="text-black">{questionMarkText}</span>
              <button 
                onClick={calculate2}
                className="px-6 py-2 bg-black text-white hover:bg-gray-800"
                data-testid="button-calculate-2"
              >
                {calculateText}
              </button>
              {result2 !== null && (
                <div className="px-3 py-2 border border-gray-300 text-black bg-white" data-testid="result-2">
                  {resultText}: {result2.toFixed(2)}{percentSymbolText}
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-gray-200 pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-black">{percentageIncreaseDecreaseText}</span>
              <input
                type="number"
                value={calc3From}
                onChange={(e) => setCalc3From(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculate3();
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('calc3To')?.focus();
                  }
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="100"
                data-testid="input-calc3-from"
              />
              <span className="text-black">{toText}</span>
              <input
                id="calc3To"
                type="number"
                value={calc3To}
                onChange={(e) => setCalc3To(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculate3();
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="120"
                data-testid="input-calc3-to"
              />
              <span className="text-black">{questionMarkText}</span>
              <button 
                onClick={calculate3}
                className="px-6 py-2 bg-black text-white hover:bg-gray-800"
                data-testid="button-calculate-3"
              >
                {calculateText}
              </button>
              {result3 !== null && (
                <div className="px-3 py-2 border border-gray-300 text-black bg-white" data-testid="result-3">
                  {resultText}: {result3.percentage.toFixed(2)}% {result3.isIncrease ? increaseText : decreaseText}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
