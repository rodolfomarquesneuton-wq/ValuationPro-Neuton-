
import React from 'react';
import { FinancialData } from '../types';
import { CalendarDays, DollarSign } from 'lucide-react';

interface DividendHistoryChartProps {
  data: FinancialData;
}

export const DividendHistoryChart: React.FC<DividendHistoryChartProps> = ({ data }) => {
  
  const history = data.dividendHistory || [];
  
  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: data.currency });

  if (history.length === 0) {
    return null; 
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-6 duration-500 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-700 dark:text-green-400">
          <CalendarDays size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Histórico de Proventos (12 Meses)</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Detalhamento dos pagamentos recentes.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Mês/Ano</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-right">Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-900 dark:text-slate-100">
            {history.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3 font-medium">{item.month}</td>
                <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-bold">{formatCurrency(item.value)}</td>
                <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                  {item.type ? (
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{item.type}</span>
                  ) : '-'}
                </td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-green-50 dark:bg-green-900/20 font-bold">
              <td className="px-4 py-3 text-green-800 dark:text-green-300">Total 12 Meses</td>
              <td className="px-4 py-3 text-right text-green-800 dark:text-green-300">
                {formatCurrency(history.reduce((acc, item) => acc + item.value, 0))}
              </td>
              <td className="px-4 py-3"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
