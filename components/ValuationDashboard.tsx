
import React, { useState, useEffect, useMemo } from 'react';
import { FinancialData, ValuationParams } from '../types';
import { Calculator, Sliders, AlertCircle, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface ValuationDashboardProps {
  data: FinancialData;
}

export const ValuationDashboard: React.FC<ValuationDashboardProps> = ({ data }) => {
  const [params, setParams] = useState<ValuationParams>({
    grahamConstant: 22.5,
    bazinYieldTarget: 6,
    gordonGrowthRate: 2,
    gordonRequiredReturn: 10,
    dcfGrowthRate: data.revenueGrowth3y > 0 ? Math.min(data.revenueGrowth3y, 15) : 5, 
    dcfDiscountRate: 12,
    dcfYears: 10,
    marginOfSafety: 30
  });

  const grahamValue = useMemo(() => {
    if (data.eps <= 0 || data.bvps <= 0) return 0;
    return Math.sqrt(params.grahamConstant * data.eps * data.bvps);
  }, [data.eps, data.bvps, params.grahamConstant]);

  const bazinValue = useMemo(() => {
    if (data.lastDividend <= 0) return 0;
    return data.lastDividend / (params.bazinYieldTarget / 100);
  }, [data.lastDividend, params.bazinYieldTarget]);

  const gordonValue = useMemo(() => {
    if (data.lastDividend <= 0) return 0;
    const k = params.gordonRequiredReturn / 100;
    const g = params.gordonGrowthRate / 100;
    if (k <= g) return 0; 
    const nextDiv = data.lastDividend * (1 + g);
    return nextDiv / (k - g);
  }, [data.lastDividend, params.gordonRequiredReturn, params.gordonGrowthRate]);

  const dcfValue = useMemo(() => {
    if (data.freeCashFlowPerShare <= 0) return 0;
    
    let sumPv = 0;
    const r = params.dcfDiscountRate / 100;
    const g = params.dcfGrowthRate / 100;
    const terminalG = 0.02; 
    
    let currentFcf = data.freeCashFlowPerShare;

    for (let i = 1; i <= params.dcfYears; i++) {
      currentFcf = currentFcf * (1 + g);
      sumPv += currentFcf / Math.pow(1 + r, i);
    }

    const terminalValue = (currentFcf * (1 + terminalG)) / (r - terminalG);
    const pvTerminal = terminalValue / Math.pow(1 + r, params.dcfYears);

    return sumPv + pvTerminal;
  }, [data.freeCashFlowPerShare, params.dcfGrowthRate, params.dcfDiscountRate, params.dcfYears]);

  // MOVED CHECK HERE: Conditional return must be AFTER all hooks
  if (data.assetClass === 'FII') {
    return null;
  }

  const chartData = [
    { name: 'Preço Atual', value: data.currentPrice, type: 'price' },
    { name: 'Graham', value: grahamValue, type: 'valuation' },
    { name: 'Bazin', value: bazinValue, type: 'valuation' },
    { name: 'Gordon', value: gordonValue, type: 'valuation' },
    { name: 'DCF', value: dcfValue, type: 'valuation' },
  ];

  const validValuations = [grahamValue, bazinValue, gordonValue, dcfValue].filter(v => v > 0);
  const avgIntrinsicValue = validValuations.length > 0 
    ? validValuations.reduce((a, b) => a + b, 0) / validValuations.length 
    : 0;
  
  const buyPrice = avgIntrinsicValue * (1 - params.marginOfSafety / 100);
  const upside = avgIntrinsicValue > 0 ? ((avgIntrinsicValue - data.currentPrice) / data.currentPrice) * 100 : 0;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 delay-200">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Parameters */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit sticky top-4">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <Sliders className="text-blue-600 dark:text-blue-400" size={20} />
            <h3 className="font-bold text-slate-800 dark:text-white">Parâmetros de Projeção</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Constante de Graham</label>
              <div className="flex items-center gap-2">
                <input 
                  type="range" min="10" max="30" step="0.5"
                  value={params.grahamConstant}
                  onChange={(e) => setParams({...params, grahamConstant: Number(e.target.value)})}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="w-12 text-right text-sm font-bold text-slate-700 dark:text-slate-200">{params.grahamConstant}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Yield Alvo (Bazin) %</label>
              <div className="flex items-center gap-2">
                <input 
                  type="range" min="1" max="15" step="0.1"
                  value={params.bazinYieldTarget}
                  onChange={(e) => setParams({...params, bazinYieldTarget: Number(e.target.value)})}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="w-12 text-right text-sm font-bold text-slate-700 dark:text-slate-200">{params.bazinYieldTarget}%</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Premissas de Crescimento</h4>
              
              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Cresc. Gordon (%)</label>
              <input 
                type="number" className="w-full p-1 border rounded text-sm mb-2 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white"
                value={params.gordonGrowthRate}
                onChange={(e) => setParams({...params, gordonGrowthRate: Number(e.target.value)})}
              />

              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Cresc. DCF (5-10 anos) (%)</label>
              <input 
                type="number" className="w-full p-1 border rounded text-sm mb-2 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white"
                value={params.dcfGrowthRate}
                onChange={(e) => setParams({...params, dcfGrowthRate: Number(e.target.value)})}
              />

              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Taxa Desconto DCF (%)</label>
              <input 
                type="number" className="w-full p-1 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white"
                value={params.dcfDiscountRate}
                onChange={(e) => setParams({...params, dcfDiscountRate: Number(e.target.value)})}
              />
            </div>

             <div>
              <label className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase mb-1 block">Margem de Segurança</label>
              <div className="flex items-center gap-2">
                <input 
                  type="range" min="0" max="50" step="5"
                  value={params.marginOfSafety}
                  onChange={(e) => setParams({...params, marginOfSafety: Number(e.target.value)})}
                  className="w-full h-2 bg-green-100 dark:bg-green-900/30 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <span className="w-12 text-right text-sm font-bold text-green-700 dark:text-green-400">{params.marginOfSafety}%</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Results & Charts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary Hero Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-t-4 border-blue-600 dark:border-blue-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-lg font-medium text-slate-500 dark:text-slate-400">Valor Intrínseco Médio</h2>
                <div className="flex items-baseline gap-2">
                   <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    {data.currency === 'BRL' ? 'R$' : '$'} {avgIntrinsicValue.toFixed(2)}
                   </span>
                   <span className={`text-sm font-bold px-2 py-1 rounded-full ${upside > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      {upside > 0 ? '+' : ''}{upside.toFixed(1)}%
                   </span>
                </div>
              </div>
              
              <div className="text-right">
                <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Preço Teto (c/ Margem {params.marginOfSafety}%)</h2>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg border border-green-100 dark:border-green-900/30 inline-block">
                   {data.currency === 'BRL' ? 'R$' : '$'} {buyPrice.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm">
              <AlertCircle size={18} />
              <p>
                O <strong>Preço Atual</strong> é <strong>{data.currentPrice.toFixed(2)}</strong>. 
                {data.currentPrice < buyPrice 
                  ? " O ativo está descontado em relação ao preço teto calculado."
                  : " O ativo está acima do preço teto sugerido pelos parâmetros."}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[400px]">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Calculator size={18} /> Comparativo de Modelos
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${data.currency === 'BRL' ? 'R$' : '$'}${val}`} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }}
                />
                <ReferenceLine y={data.currentPrice} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Preço Atual', position: 'insideTopRight', fill: '#3b82f6', fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.type === 'price' ? '#94a3b8' : entry.value > data.currentPrice ? '#22c55e' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
};
