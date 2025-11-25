
import React from 'react';
import { FinancialData } from '../types';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, BookOpen, HelpCircle, Calculator, Target } from 'lucide-react';

interface FundamentalCardProps {
  data: FinancialData;
}

interface MetricItemProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  sub?: string;
  color?: string;
  tooltip?: string;
  highlight?: boolean;
  bgColor?: string;
  borderColor?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, icon, sub, color = "text-slate-900 dark:text-white", tooltip, highlight = false, bgColor, borderColor }) => (
  <div className={`relative group flex flex-col p-3 rounded-lg border transition-shadow 
    ${highlight 
      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' 
      : bgColor 
        ? `${bgColor} ${borderColor} dark:bg-slate-800 dark:border-slate-700` 
        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md'}`}>
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-medium uppercase tracking-wider ${highlight ? 'text-blue-700 dark:text-blue-300' : color.includes('indigo') ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>{label}</span>
        {tooltip && (
          <div className="relative">
            <HelpCircle size={12} className={`${color.includes('indigo') ? 'text-indigo-400' : 'text-slate-400 dark:text-slate-500'} cursor-help hover:text-blue-500 transition-colors`} />
            {/* Tooltip Popup */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-slate-800 dark:bg-slate-700 text-white text-xs p-2 rounded shadow-lg z-10 pointer-events-none">
              {tooltip}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
            </div>
          </div>
        )}
      </div>
      {icon && <span className={highlight ? 'text-blue-400' : color.includes('indigo') ? 'text-indigo-400' : 'text-slate-400 dark:text-slate-500'}>{icon}</span>}
    </div>
    <span className={`text-lg font-bold ${color}`}>{value}</span>
    {sub && <span className={`text-xs mt-1 ${color.includes('indigo') ? 'text-indigo-400 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'}`}>{sub}</span>}
  </div>
);

export const FundamentalCard: React.FC<FundamentalCardProps> = ({ data }) => {
  
  const isFII = data.assetClass === 'FII';

  const calculateGraham = () => {
    if (data.eps <= 0 || data.bvps <= 0) return 0;
    return Math.sqrt(22.5 * data.eps * data.bvps);
  };

  const grahamPrice = calculateGraham();
  const grahamUpside = grahamPrice > 0 ? ((grahamPrice - data.currentPrice) / data.currentPrice) * 100 : 0;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-100">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{data.ticker}</h2>
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2.5 py-0.5 rounded">{data.sector}</span>
              {data.assetClass && <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded">{data.assetClass}</span>}
            </div>
            <h3 className="text-lg text-slate-600 dark:text-slate-400">{data.name}</h3>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">Preço Atual</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {data.currency === 'BRL' ? 'R$' : '$'} {data.currentPrice.toFixed(2)}
            </p>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm leading-relaxed border-l-4 border-blue-500 pl-4 italic">
          {data.description}
        </p>

        {/* General Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          
          {!isFII && (
            <div className="col-span-2 md:col-span-1">
               <MetricItem 
                label="Preço Justo (Graham)" 
                value={grahamPrice > 0 ? (data.currency === 'BRL' ? `R$ ${grahamPrice.toFixed(2)}` : `$ ${grahamPrice.toFixed(2)}`) : 'N/A'} 
                icon={<Calculator size={16} />}
                highlight={true}
                color={grahamUpside > 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}
                sub={grahamPrice > 0 ? `${grahamUpside > 0 ? '+' : ''}${grahamUpside.toFixed(1)}% Potencial` : undefined}
                tooltip="Cálculo: √(22.5 × LPA × VPA). Estima o valor intrínseco baseando-se nos lucros e no patrimônio."
              />
            </div>
          )}

          <MetricItem 
            label={isFII ? "Rend. Médio" : "LPA (EPS)"}
            value={data.eps.toFixed(2)} 
            icon={<Activity size={16} />}
            sub={isFII ? "Por Cota (Mês)" : "Lucro por Ação"}
            tooltip={isFII ? "Rendimento Médio mensal aproximado." : "Lucro por Ação = Lucro Líquido / Nº Total de Ações."}
          />
          <MetricItem 
            label="VPA (BVPS)" 
            value={data.bvps.toFixed(2)} 
            icon={<BookOpen size={16} />}
            sub="Val. Patrimonial/Ação"
            tooltip="Valor Patrimonial por Ação = Patrimônio Líquido / Nº Total de Ações. Indica o valor contábil de cada ação."
          />
          <MetricItem 
            label="Div. Yield" 
            value={`${data.dividendYield.toFixed(2)}%`} 
            icon={<DollarSign size={16} />}
            color="text-green-600 dark:text-green-400"
            sub={`Últimos 12m: ${data.lastDividend.toFixed(2)}`}
            tooltip="Dividend Yield = (Dividendos pagos nos últimos 12 meses / Preço Atual da Ação) × 100."
          />
          
          {!isFII && (
             <MetricItem 
               label="P/L (P/E)" 
               value={data.peRatio.toFixed(2)} 
               icon={<PieChart size={16} />}
               tooltip="Preço / Lucro = Preço da Ação / LPA. Indica quantos anos levaria para recuperar o capital investido através dos lucros."
             />
          )}

          <MetricItem 
            label="P/VP (P/B)" 
            value={data.pbRatio.toFixed(2)} 
            icon={<PieChart size={16} />}
            tooltip="Preço / Valor Patrimonial = Preço da Ação / VPA. Indica quanto o mercado paga sobre o patrimônio líquido da empresa."
          />
          
          {!isFII && (
            <>
              <MetricItem 
                label="ROE" 
                value={`${data.roe.toFixed(2)}%`} 
                icon={<TrendingUp size={16} />}
                color={data.roe > 10 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}
                tooltip="Return on Equity = (Lucro Líquido / Patrimônio Líquido) × 100. Mede a capacidade da empresa de gerar valor com seus próprios recursos."
              />
              <MetricItem 
                label="Margem Líq." 
                value={`${data.netMargin.toFixed(2)}%`} 
                icon={<TrendingDown size={16} />} 
                tooltip="Margem Líquida = (Lucro Líquido / Receita Líquida) × 100. Mostra quanto sobra de lucro para cada real vendido."
              />
               <MetricItem 
                label="Dívida/PL" 
                value={data.debtToEquity.toFixed(2)} 
                color={data.debtToEquity > 2 ? "text-red-500" : "text-slate-900 dark:text-white"}
                tooltip="Dívida Líquida / Patrimônio Líquido. Mede o nível de alavancagem da empresa. Acima de 2 ou 3 requer cautela."
              />
            </>
          )}
        </div>

        {/* Sector Specific Metrics (Highlighted) */}
        {data.sectorMetrics && data.sectorMetrics.length > 0 && (
           <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-900/30 animate-in fade-in">
              <div className="flex items-center gap-2 mb-3 text-indigo-800 dark:text-indigo-300 font-bold">
                 <Target size={18} />
                 <h4>Indicadores Específicos: {data.sector}</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.sectorMetrics.map((metric, idx) => (
                  <MetricItem 
                    key={idx}
                    label={metric.label}
                    value={`${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`}
                    tooltip={metric.tooltip}
                    color="text-indigo-800 dark:text-indigo-300"
                    bgColor="bg-white dark:bg-slate-800"
                    borderColor="border-indigo-100 dark:border-indigo-900/30"
                  />
                ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
