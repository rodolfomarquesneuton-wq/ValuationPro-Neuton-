
import React, { useState, useMemo } from 'react';
import { FinancialData } from '../types';
import { DollarSign, Target, Calculator, TrendingUp } from 'lucide-react';

interface DividendSimulatorProps {
  data: FinancialData;
}

export const DividendSimulator: React.FC<DividendSimulatorProps> = ({ data }) => {
  const [quantity, setQuantity] = useState<number>(100);
  const [projectedYield, setProjectedYield] = useState<number>(data.dividendYield || 6);
  const [targetMonthlyIncome, setTargetMonthlyIncome] = useState<number>(1000);

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: data.currency });

  const price = data.currentPrice;
  
  const projectedDps = useMemo(() => {
    return price * (projectedYield / 100);
  }, [price, projectedYield]);

  const totalInvestment = quantity * price;
  const annualIncome = quantity * projectedDps;
  const monthlyIncome = annualIncome / 12;

  const magicNumberShares = useMemo(() => {
    if (projectedDps <= 0) return 0;
    return Math.ceil((targetMonthlyIncome * 12) / projectedDps);
  }, [targetMonthlyIncome, projectedDps]);

  const magicNumberInvestment = magicNumberShares * price;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-in slide-in-from-bottom-6 duration-500 delay-150">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-700 dark:text-green-400">
          <DollarSign size={24} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Simulador de Proventos</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Projete sua renda passiva ajustando o Yield e quantidade.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Inputs */}
        <div className="space-y-6">
          
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-600">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600 dark:text-blue-400"/> Yield Projetado (%)
              </label>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{projectedYield.toFixed(2)}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="20" step="0.1"
              value={projectedYield}
              onChange={(e) => setProjectedYield(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
              <span>Estimativa DPS: <strong>{formatCurrency(projectedDps)}</strong> / ano</span>
              <span>Atual: {data.dividendYield?.toFixed(2)}%</span>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1 block">Quantidade de Cotas/Ações</label>
            <div className="relative">
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full pl-4 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">UN</span>
            </div>
          </div>

          {/* Target Income Input */}
          <div>
             <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1 block flex items-center gap-1">
                <Target size={14} /> Meta de Renda Mensal
             </label>
             <div className="relative">
               <span className="absolute left-3 top-2.5 text-slate-400 text-sm">R$</span>
               <input 
                 type="number" 
                 value={targetMonthlyIncome}
                 onChange={(e) => setTargetMonthlyIncome(Number(e.target.value))}
                 className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
               />
             </div>
          </div>

        </div>

        {/* Middle: Current Projection Results */}
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-6 border border-slate-200 dark:border-slate-600 flex flex-col justify-center space-y-6">
           <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sua Simulação Atual</h4>
           
           <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Investimento Necessário</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalInvestment)}</p>
           </div>

           <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Renda Mensal Estimada</p>
              <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">{formatCurrency(monthlyIncome)}</p>
              <p className="text-xs text-slate-400 mt-1">Anual: {formatCurrency(annualIncome)}</p>
           </div>
        </div>

        {/* Right: Magic Number Results */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-900/30 flex flex-col justify-center space-y-6">
            <h4 className="text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
               <Calculator size={16}/> O Número Mágico
            </h4>
            <p className="text-xs text-purple-600 dark:text-purple-300 leading-relaxed">
               Para atingir sua meta de <strong>{formatCurrency(targetMonthlyIncome)}</strong> mensais com um yield de <strong>{projectedYield}%</strong>:
            </p>

            <div>
               <p className="text-sm text-purple-600 dark:text-purple-300 mb-1">Cotas Necessárias</p>
               <p className="text-3xl font-extrabold text-purple-800 dark:text-purple-200">{magicNumberShares.toLocaleString('pt-BR')} <span className="text-sm font-medium">cotas</span></p>
            </div>

            <div className="pt-4 border-t border-purple-200 dark:border-purple-900/30">
               <p className="text-sm text-purple-600 dark:text-purple-300 mb-1">Patrimônio Necessário</p>
               <p className="text-xl font-bold text-purple-800 dark:text-purple-200">{formatCurrency(magicNumberInvestment)}</p>
            </div>
        </div>

      </div>
    </div>
  );
};
