
import React, { useState } from 'react';
import { getDividendProjection } from '../services/geminiService';
import { DividendProjectionResult } from '../types';
import { Loader2, FileText, Calculator, AlertTriangle, BrainCircuit, Search } from 'lucide-react';

export const DividendProjectionTab: React.FC = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DividendProjectionResult | null>(null);
  const [error, setError] = useState('');

  const [simNetIncome, setSimNetIncome] = useState<number>(0);
  const [simPayout, setSimPayout] = useState<number>(0);
  const [simShares, setSimShares] = useState<number>(0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker) return;
    setLoading(true);
    setError('');
    setData(null);

    try {
      const result = await getDividendProjection(ticker);
      setData(result);
      setSimNetIncome(result.reportedNetIncome || 0);
      setSimPayout(result.payoutRatio || 0);
      setSimShares(result.sharesOutstanding || 0);
    } catch (err) {
      setError("Não foi possível analisar os relatórios. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleNetIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = Number(rawValue) / 100;
    setSimNetIncome(numericValue);
  };

  const handleSharesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setSimShares(Number(rawValue));
  };

  const calculatedDividend = simShares > 0 ? (simNetIncome * (simPayout / 100)) / simShares : 0;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Projeção de Proventos</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          A Inteligência Artificial analisa os relatórios gerenciais (FIIs) ou resultados trimestrais (Ações) para projetar o próximo pagamento.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-lg mx-auto mb-10">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Digite o Ticker (Ex: VALE3, HGLG11)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="w-full pl-12 pr-4 py-3 text-lg rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none shadow-sm placeholder:text-slate-400"
          />
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          <button 
            type="submit" 
            disabled={loading || !ticker}
            className="absolute right-2 top-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-1.5 rounded-full font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : 'Analisar'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-20">
          <BrainCircuit className="w-16 h-16 mx-auto mb-4 text-purple-500 animate-pulse" />
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Lendo Relatórios...</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
            A IA está consultando o relatório mais recente, analisando o lucro líquido, guidance e eventos não recorrentes para projetar o dividendo.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg text-center border border-red-200 dark:border-red-900/30">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-8">
          
          {/* Report Analysis Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 border-b border-purple-100 dark:border-purple-900/30 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <FileText className="text-purple-700 dark:text-purple-400" size={20} />
                 <h3 className="font-bold text-purple-800 dark:text-purple-300">Análise do Resultado: {data.latestReportDate}</h3>
               </div>
               <span className="bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 text-xs font-bold px-2 py-1 rounded border border-purple-100 dark:border-purple-900/30">
                 {data.ticker}
               </span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Destaques do Relatório</h4>
                <div className="prose prose-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {data.reportHighlights}
                </div>
              </div>
              <div>
                 <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Racional da Projeção (IA)</h4>
                 <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 italic">
                   "{data.reasoning}"
                 </div>
                 <div className="mt-4">
                    <h4 className="text-sm font-bold text-red-500 dark:text-red-400 uppercase mb-1 flex items-center gap-1">
                      <AlertTriangle size={14}/> Fatores de Risco
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{data.riskFactors}</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Calculator Simulation */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-6">
               <Calculator className="text-blue-600 dark:text-blue-400" size={24} />
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">Calculadora de Projeção</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
               <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Lucro/Result. Líquido</label>
                 <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-sm">R$</span>
                    <input 
                      type="text"
                      value={simNetIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      onChange={handleNetIncomeChange}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                 </div>
                 <span className="text-xs text-slate-400">
                    Reportado: {data.reportedNetIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                 </span>
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Payout Ratio (%)</label>
                 <div className="relative">
                   <input 
                     type="number" 
                     value={simPayout}
                     onChange={(e) => setSimPayout(Number(e.target.value))}
                     className="w-full pl-4 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                   />
                   <span className="absolute right-3 top-2.5 text-slate-500 text-sm">%</span>
                 </div>
                 <span className="text-xs text-slate-400">Histórico: {data.payoutRatio}%</span>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nº Ações/Cotas</label>
                 <input 
                   type="text"
                   value={simShares.toLocaleString('pt-BR')}
                   onChange={handleSharesChange}
                   className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                 />
               </div>
               
               <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase">Dividendo Projetado</p>
                  <p className="text-2xl font-extrabold text-blue-800 dark:text-blue-300">
                    R$ {calculatedDividend.toLocaleString('pt-BR', {minimumFractionDigits: 4, maximumFractionDigits: 4})}
                  </p>
               </div>
            </div>
          </div>

          {/* Disclaimer Footer */}
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 p-4 rounded-lg border border-amber-200 dark:border-amber-900/30 text-sm flex items-start gap-3">
             <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} />
             <div>
               <p className="font-bold mb-1">Considerações Finais Importantes</p>
               <p className="opacity-90">
                 Esta ferramenta utiliza Inteligência Artificial para analisar relatórios passados e projetar cenários futuros. 
                 <strong>Isto NÃO é uma recomendação de compra ou venda, nem garantia de rentabilidade futura.</strong> 
                 Os resultados reais podem variar significativamente devido a eventos não recorrentes, mudanças na política da empresa ou condições de mercado.
                 Sempre valide os dados com as fontes oficiais (RI da empresa).
               </p>
             </div>
          </div>

        </div>
      )}
    </div>
  );
};
