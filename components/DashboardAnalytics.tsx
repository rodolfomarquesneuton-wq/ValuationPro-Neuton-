
import React, { useState, useMemo } from 'react';
import { PortfolioItem } from '../types';
import { generateDashboardHistory } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, DollarSign, PieChart as PieIcon, Globe, Layers } from 'lucide-react';

interface DashboardAnalyticsProps {
  portfolio: PortfolioItem[];
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ portfolio }) => {
  const [allocationView, setAllocationView] = useState<'type' | 'asset' | 'exposure'>('type');
  const [dividendView, setDividendView] = useState<'monthly' | 'yearly'>('monthly');

  const totalBalance = portfolio.reduce((acc, item) => acc + (item.currentPrice * item.quantity), 0);
  const annualDividendsEstimate = portfolio.reduce((acc, item) => {
    if (!item.dy) return acc;
    const value = item.currentPrice * item.quantity;
    return acc + (value * (item.dy / 100));
  }, 0);

  const history = useMemo(() => 
    generateDashboardHistory(totalBalance, annualDividendsEstimate), 
  [totalBalance, annualDividendsEstimate]);

  const allocationData = useMemo(() => {
    if (allocationView === 'type') {
      const groups = portfolio.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + (item.currentPrice * item.quantity);
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(groups).map(([name, value]) => ({ name, value }));
    } else if (allocationView === 'asset') {
      return portfolio.map(p => ({ name: p.ticker, value: p.currentPrice * p.quantity }));
    } else {
      const international = portfolio.filter(p => 
        p.category === 'BDR' || 
        ['IVVB11', 'WRLD11', 'SPXI11', 'GOLD11', 'EURP11', 'XINA11'].includes(p.ticker)
      ).reduce((acc, i) => acc + (i.currentPrice * i.quantity), 0);
      
      return [
        { name: 'Nacional', value: totalBalance - international },
        { name: 'Exterior', value: international }
      ];
    }
  }, [portfolio, allocationView, totalBalance]);

  const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ef4444', '#eab308', '#14b8a6', '#6366f1'];

  if (portfolio.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500 dark:text-slate-400">
        <PieIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Carteira Vazia</h3>
        <p>Adicione ativos na aba "Minha Carteira" para visualizar os gráficos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Net Worth Evolution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" /> Evolução Patrimonial
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history.netWorthHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR', {maximumFractionDigits: 0})}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dividends Evolution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <DollarSign size={20} className="text-green-600 dark:text-green-400" /> Evolução de Proventos
            </h3>
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 text-xs">
              <button 
                onClick={() => setDividendView('monthly')}
                className={`px-3 py-1 rounded ${dividendView === 'monthly' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
              >Mensal</button>
              <button 
                 onClick={() => setDividendView('yearly')}
                className={`px-3 py-1 rounded ${dividendView === 'yearly' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
              >Anual</button>
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dividendView === 'monthly' ? history.monthlyDividends : history.yearlyDividends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey={dividendView === 'monthly' ? 'month' : 'year'} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR', {maximumFractionDigits: 2})}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }}
                />
                <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom: Allocation */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <PieIcon size={20} className="text-purple-600 dark:text-purple-400" /> Consolidação da Carteira
            </h3>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setAllocationView('type')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors ${allocationView === 'type' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <Layers size={14} /> Por Tipo
              </button>
              <button 
                onClick={() => setAllocationView('asset')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors ${allocationView === 'asset' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                 <PieIcon size={14} /> Por Ativo
              </button>
              <button 
                onClick={() => setAllocationView('exposure')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors ${allocationView === 'exposure' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                 <Globe size={14} /> Nacional vs Exterior
              </button>
            </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
             <PieChart>
                <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                >
                    {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip 
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }}
                />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
             </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
