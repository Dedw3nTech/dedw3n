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

  const [grossRevenue, setGrossRevenue] = useState('');
  const [grossCost, setGrossCost] = useState('');
  const [resultGross, setResultGross] = useState<number | null>(null);

  const [netRevenue, setNetRevenue] = useState('');
  const [netExpenses, setNetExpenses] = useState('');
  const [resultNet, setResultNet] = useState<number | null>(null);

  const [markupCost, setMarkupCost] = useState('');
  const [markupPrice, setMarkupPrice] = useState('');
  const [resultMarkup, setResultMarkup] = useState<number | null>(null);

  const [vatAmount, setVatAmount] = useState('');
  const [vatRate, setVatRate] = useState('');
  const [resultVat, setResultVat] = useState<number | null>(null);

  const [taxIncome, setTaxIncome] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [resultTax, setResultTax] = useState<number | null>(null);

  const [cashInflow, setCashInflow] = useState('');
  const [cashOutflow, setCashOutflow] = useState('');
  const [resultCashFlow, setResultCashFlow] = useState<number | null>(null);

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
    'decrease',
    'Gross Margin: Revenue',
    'Cost',
    'Net Profit Margin: Revenue',
    'Total Expenses',
    'Markup: Cost',
    'Selling Price',
    'VAT: Amount',
    'VAT Rate',
    'Income Tax: Income',
    'Tax Rate',
    'Cash Flow: Inflow',
    'Outflow'
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
    decreaseText,
    grossMarginRevenueText,
    grossMarginCostText,
    netProfitRevenueText,
    netProfitExpensesText,
    markupCostText,
    markupPriceText,
    vatAmountText,
    vatRateText,
    incomeTaxIncomeText,
    incomeTaxRateText,
    cashFlowInflowText,
    cashFlowOutflowText
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

  const calculateGrossMargin = () => {
    const revenue = parseFloat(grossRevenue);
    const cost = parseFloat(grossCost);
    if (!isNaN(revenue) && !isNaN(cost) && revenue !== 0) {
      const margin = ((revenue - cost) / revenue) * 100;
      setResultGross(margin);
    }
  };

  const calculateNetProfit = () => {
    const revenue = parseFloat(netRevenue);
    const expenses = parseFloat(netExpenses);
    if (!isNaN(revenue) && !isNaN(expenses) && revenue !== 0) {
      const netProfit = ((revenue - expenses) / revenue) * 100;
      setResultNet(netProfit);
    }
  };

  const calculateMarkup = () => {
    const cost = parseFloat(markupCost);
    const price = parseFloat(markupPrice);
    if (!isNaN(cost) && !isNaN(price) && cost !== 0) {
      const markup = ((price - cost) / cost) * 100;
      setResultMarkup(markup);
    }
  };

  const calculateVAT = () => {
    const amount = parseFloat(vatAmount);
    const rate = parseFloat(vatRate);
    if (!isNaN(amount) && !isNaN(rate)) {
      const vat = (amount * rate) / 100;
      setResultVat(vat);
    }
  };

  const calculateIncomeTax = () => {
    const income = parseFloat(taxIncome);
    const rate = parseFloat(taxRate);
    if (!isNaN(income) && !isNaN(rate)) {
      const tax = (income * rate) / 100;
      setResultTax(tax);
    }
  };

  const calculateCashFlow = () => {
    const inflow = parseFloat(cashInflow);
    const outflow = parseFloat(cashOutflow);
    if (!isNaN(inflow) && !isNaN(outflow)) {
      const netCashFlow = inflow - outflow;
      setResultCashFlow(netCashFlow);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
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

          <div className="border-b border-gray-200 pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-black">{grossMarginRevenueText}</span>
              <input
                type="number"
                value={grossRevenue}
                onChange={(e) => setGrossRevenue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculateGrossMargin();
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('grossCost')?.focus();
                  }
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="1000"
                data-testid="input-gross-revenue"
              />
              <span className="text-black">{grossMarginCostText}</span>
              <input
                id="grossCost"
                type="number"
                value={grossCost}
                onChange={(e) => setGrossCost(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculateGrossMargin();
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="600"
                data-testid="input-gross-cost"
              />
              <button 
                onClick={calculateGrossMargin}
                className="px-6 py-2 bg-black text-white hover:bg-gray-800"
                data-testid="button-calculate-gross"
              >
                {calculateText}
              </button>
              {resultGross !== null && (
                <div className="px-3 py-2 border border-gray-300 text-black bg-white" data-testid="result-gross">
                  {resultText}: {resultGross.toFixed(2)}{percentSymbolText}
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-gray-200 pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-black">{netProfitRevenueText}</span>
              <input
                type="number"
                value={netRevenue}
                onChange={(e) => setNetRevenue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculateNetProfit();
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('netExpenses')?.focus();
                  }
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="1000"
                data-testid="input-net-revenue"
              />
              <span className="text-black">{netProfitExpensesText}</span>
              <input
                id="netExpenses"
                type="number"
                value={netExpenses}
                onChange={(e) => setNetExpenses(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculateNetProfit();
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="700"
                data-testid="input-net-expenses"
              />
              <button 
                onClick={calculateNetProfit}
                className="px-6 py-2 bg-black text-white hover:bg-gray-800"
                data-testid="button-calculate-net"
              >
                {calculateText}
              </button>
              {resultNet !== null && (
                <div className="px-3 py-2 border border-gray-300 text-black bg-white" data-testid="result-net">
                  {resultText}: {resultNet.toFixed(2)}{percentSymbolText}
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-gray-200 pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-black">{markupCostText}</span>
              <input
                type="number"
                value={markupCost}
                onChange={(e) => setMarkupCost(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculateMarkup();
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('markupPrice')?.focus();
                  }
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="50"
                data-testid="input-markup-cost"
              />
              <span className="text-black">{markupPriceText}</span>
              <input
                id="markupPrice"
                type="number"
                value={markupPrice}
                onChange={(e) => setMarkupPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculateMarkup();
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="75"
                data-testid="input-markup-price"
              />
              <button 
                onClick={calculateMarkup}
                className="px-6 py-2 bg-black text-white hover:bg-gray-800"
                data-testid="button-calculate-markup"
              >
                {calculateText}
              </button>
              {resultMarkup !== null && (
                <div className="px-3 py-2 border border-gray-300 text-black bg-white" data-testid="result-markup">
                  {resultText}: {resultMarkup.toFixed(2)}{percentSymbolText}
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-gray-200 pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-black">{vatAmountText}</span>
              <input
                type="number"
                value={vatAmount}
                onChange={(e) => setVatAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculateVAT();
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('vatRate')?.focus();
                  }
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="100"
                data-testid="input-vat-amount"
              />
              <span className="text-black">{vatRateText}</span>
              <input
                id="vatRate"
                type="number"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculateVAT();
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="20"
                data-testid="input-vat-rate"
              />
              <span className="text-black">{percentSymbolText}</span>
              <button 
                onClick={calculateVAT}
                className="px-6 py-2 bg-black text-white hover:bg-gray-800"
                data-testid="button-calculate-vat"
              >
                {calculateText}
              </button>
              {resultVat !== null && (
                <div className="px-3 py-2 border border-gray-300 text-black bg-white" data-testid="result-vat">
                  {resultText}: {resultVat.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-gray-200 pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-black">{incomeTaxIncomeText}</span>
              <input
                type="number"
                value={taxIncome}
                onChange={(e) => setTaxIncome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculateIncomeTax();
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('taxRate')?.focus();
                  }
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="50000"
                data-testid="input-tax-income"
              />
              <span className="text-black">{incomeTaxRateText}</span>
              <input
                id="taxRate"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculateIncomeTax();
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="25"
                data-testid="input-tax-rate"
              />
              <span className="text-black">{percentSymbolText}</span>
              <button 
                onClick={calculateIncomeTax}
                className="px-6 py-2 bg-black text-white hover:bg-gray-800"
                data-testid="button-calculate-tax"
              >
                {calculateText}
              </button>
              {resultTax !== null && (
                <div className="px-3 py-2 border border-gray-300 text-black bg-white" data-testid="result-tax">
                  {resultText}: {resultTax.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-gray-200 pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-black">{cashFlowInflowText}</span>
              <input
                type="number"
                value={cashInflow}
                onChange={(e) => setCashInflow(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculateCashFlow();
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('cashOutflow')?.focus();
                  }
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="10000"
                data-testid="input-cash-inflow"
              />
              <span className="text-black">{cashFlowOutflowText}</span>
              <input
                id="cashOutflow"
                type="number"
                value={cashOutflow}
                onChange={(e) => setCashOutflow(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') calculateCashFlow();
                }}
                className="w-24 px-3 py-2 border border-gray-300 text-black bg-white"
                placeholder="7000"
                data-testid="input-cash-outflow"
              />
              <button 
                onClick={calculateCashFlow}
                className="px-6 py-2 bg-black text-white hover:bg-gray-800"
                data-testid="button-calculate-cashflow"
              >
                {calculateText}
              </button>
              {resultCashFlow !== null && (
                <div className="px-3 py-2 border border-gray-300 text-black bg-white" data-testid="result-cashflow">
                  {resultText}: {resultCashFlow.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
