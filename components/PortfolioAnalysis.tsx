
import React from 'react';
import { PortfolioItem } from '../types';
import { TrendingDown, TrendingUp, AlertCircle, Minus } from 'lucide-react';

interface PortfolioAnalysisProps {
  portfolio: PortfolioItem[];
}

export const PortfolioAnalysis: React.FC<PortfolioAnalysisProps> = ({ portfolio }) => {
  
  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const calculateGraham = (price: number, pl?: number, pvp?: number) => {
    if (!pl || !pvp || pl <= 0 || pvp <= 0) return 0;
    const factor = 22.5 / (pl * pvp);
    if (factor < 0) return 0;
    return price * Math.sqrt(factor);
  };

  const calculateBazin = (price: number, dy?: number) => {
    if (!dy) return 0;
    const dividendPerShare = price * (dy / 100);
    return dividendPerShare / 0.06;
  };

  if (portfolio.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500 dark:text-slate-400">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Carteira Vazia</h3>
        <p>Adicione ativos na aba "Minha Carteira" para gerar análises de decisão.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
        <h3 className="text-blue-800 dark:text-blue-300 font-bold flex items-center gap-2">
          <AlertCircle size={18} />
          Análise Automática de Decisão
        </h3>
        <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
          Os valores intrínsecos abaixo são calculados automaticamente com base nos múltiplos atuais (P/L, P/VP, DY).
          Para ETFs e BDRs, a análise pode ser limitada pela ausência de indicadores fundamentalistas padronizados.
        </p>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm text-left text-slate-900 dark:text-slate-100">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Ativo</th>
              <th className="px-4 py-3">Preço Atual</th>
              <th className="px-4 py-3">Valor Graham</th>
              <th className="px-4 py-3">Valor Bazin (6%)</th>
              <th className="px-4 py-3">Margem Seg.</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {portfolio.map((item) => {
              // Removed the filter that excluded ETFs and BDRs

              const graham = calculateGraham(item.currentPrice, item.pl, item.pvp);
              const bazin = calculateBazin(item.currentPrice, item.dy);
              
              // Determine Target Value based on Asset Category
              let targetValue = 0;
              if (item.category === 'ACAO') {
                 targetValue = graham > 0 ? graham : bazin;
              } else if (item.category === 'FII') {
                 targetValue = bazin;
              } else {
                 // For ETFs/BDRs, use Bazin if Yield exists, otherwise 0
                 targetValue = bazin;
              }
              
              const margin = targetValue > 0 ? ((targetValue - item.currentPrice) / targetValue) * 100 : 0;
              
              let status = 'NEUTRO';
              let color = 'text-slate-500 dark:text-slate-400';
              let bg = 'bg-slate-100 dark:bg-slate-700';

              if (targetValue === 0) {
                 status = 'MANTER'; // Neutral status for unanalyzable assets
                 color = 'text-blue-600 dark:text-blue-400';
                 bg = 'bg-blue-50 dark:bg-blue-900/20';
              } else if (margin > 15) {
                status = 'COMPRA';
                color = 'text-green-700 dark:text-green-400';
                bg = 'bg-green-100 dark:bg-green-900/30';
              } else if (margin < -10) {
                status = 'CARO';
                color = 'text-red-700 dark:text-red-400';
                bg = 'bg-red-100 dark:bg-red-900/30';
              } else {
                status = 'AGUARDAR';
                color = 'text-amber-700 dark:text-amber-400';
                bg = 'bg-amber-100 dark:bg-amber-900/30';
              }

              return (
                <tr key={item.ticker} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {item.ticker}
                    <span className="block text-xs text-slate-400 font-normal">{item.category}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(item.currentPrice)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {item.category === 'ACAO' && graham > 0 ? formatCurrency(graham) : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {bazin > 0 ? formatCurrency(bazin) : '-'}
                  </td>
                  <td className={`px-4 py-3 font-bold ${margin > 0 ? 'text-green-600 dark:text-green-400' : (targetValue > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400')}`}>
                    {targetValue > 0 ? `${margin.toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${bg} ${color}`}>
                       {status === 'COMPRA' && <TrendingUp size={12}/>}
                       {status === 'CARO' && <TrendingDown size={12}/>}
                       {status === 'MANTER' && <Minus size={12}/>}
                       {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
