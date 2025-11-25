
import React, { useState, useEffect } from 'react';
import { analyzeTicker } from './services/geminiService';
import { AnalysisResult, PortfolioItem } from './types';
import { LoadingState } from './components/LoadingState';
import { FundamentalCard } from './components/FundamentalCard';
import { ValuationDashboard } from './components/ValuationDashboard';
import { PortfolioDashboard } from './components/PortfolioDashboard';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { PortfolioAnalysis } from './components/PortfolioAnalysis';
import { DividendSimulator } from './components/DividendSimulator';
import { DividendHistoryChart } from './components/DividendHistoryChart';
import { DividendProjectionTab } from './components/DividendProjectionTab';
import { MarketTicker } from './components/MarketTicker';
import { Search, Github, Info, PieChart, BarChart3, LayoutDashboard, ClipboardList, Calculator, Sun, Moon } from 'lucide-react';

function App() {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Navigation State
  const [activeTab, setActiveTab] = useState<'analyze' | 'portfolio' | 'dashboard' | 'portfolio-analysis' | 'dividend-projection'>('analyze');

  // Portfolio State
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  // Analysis State
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Theme from LocalStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('vip-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // Toggle Theme Function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('vip-theme', newTheme);
  };

  // Centralized Analysis Logic
  const runAnalysis = async (tickerToAnalyze: string) => {
    if (!tickerToAnalyze.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const data = await analyzeTicker(tickerToAnalyze);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(ticker);
  };

  const handleTickerClick = (selectedTicker: string) => {
    // Don't analyze indices directly as they don't fit the stock model well
    if (selectedTicker === 'IBOV' || selectedTicker === 'IFIX' || selectedTicker === 'USDBRL') {
      return;
    }
    setTicker(selectedTicker);
    setActiveTab('analyze');
    runAnalysis(selectedTicker);
    // Smooth scroll to analysis area
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const NavButton = ({ tab, label, icon: Icon }: { tab: typeof activeTab, label: string, icon: React.ElementType }) => (
    <button 
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center gap-2 
        ${activeTab === tab 
          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
    >
      <Icon size={16} />
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className={`${theme}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('analyze')}>
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <Search size={20} strokeWidth={3} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hidden sm:inline">
                Value<span className="text-blue-600 dark:text-blue-400">Invest</span>Pro
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg overflow-x-auto">
                <NavButton tab="analyze" label="Análise" icon={BarChart3} />
                <NavButton tab="portfolio" label="Carteira" icon={ClipboardList} />
                <NavButton tab="dashboard" label="Dash" icon={LayoutDashboard} />
                <NavButton tab="portfolio-analysis" label="Decisão" icon={PieChart} />
                <NavButton tab="dividend-projection" label="Projeção" icon={Calculator} />
              </div>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 mx-1"></div>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                title={theme === 'light' ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </div>
        </header>

        <main className="w-full">
          
          {/* Market Ticker - Always visible on all tabs */}
          <MarketTicker onTickerClick={handleTickerClick} />

          {activeTab === 'analyze' && (
            <>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero / Search Section */}
                <div className="max-w-3xl mx-auto text-center mb-12">
                  <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                    Descubra o Valor Real dos Ativos
                  </h1>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                    Analise ações e FIIs (BR e EUA) utilizando os métodos de Graham, Bazin e Fluxo de Caixa Descontado.
                  </p>
                  
                  <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
                    <input
                      type="text"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      placeholder="Ex: PETR4, AAPL, HGLG11..."
                      className="w-full pl-5 pr-14 py-4 text-lg rounded-full border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all shadow-sm placeholder:text-slate-400"
                    />
                    <button 
                      type="submit" 
                      disabled={loading || !ticker}
                      className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-full px-6 font-semibold transition-colors flex items-center justify-center"
                    >
                      {loading ? '...' : 'Analisa'}
                    </button>
                  </form>
                </div>

                {/* Content Area */}
                {error && (
                  <div className="max-w-2xl mx-auto bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-900/30 flex items-center gap-3">
                    <Info size={20} />
                    <p>{error}</p>
                  </div>
                )}

                {loading && <LoadingState ticker={ticker} />}

                {result && (
                  <div className="space-y-8">
                    {/* Raw Data Section */}
                    <FundamentalCard data={result.data} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       {/* Dividend Simulator */}
                       <DividendSimulator data={result.data} />
                       
                       {/* Dividend History Chart */}
                       <DividendHistoryChart data={result.data} />
                    </div>
                    
                    {/* Analysis Dashboard - Will hide automatically for FIIs inside component */}
                    <ValuationDashboard data={result.data} />

                    {/* Sources Footer */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-12">
                      <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Fontes Consultadas</h4>
                      <ul className="text-xs text-slate-400 dark:text-slate-500 space-y-1">
                        {result.groundingUrls.map((url, idx) => (
                          <li key={idx}>
                            <a href={url} target="_blank" rel="noreferrer" className="hover:text-blue-500 truncate block max-w-2xl underline">
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'portfolio' && (
              <PortfolioDashboard portfolio={portfolio} setPortfolio={setPortfolio} />
            )}

            {activeTab === 'dashboard' && (
              <DashboardAnalytics portfolio={portfolio} />
            )}

            {activeTab === 'portfolio-analysis' && (
              <PortfolioAnalysis portfolio={portfolio} />
            )}

            {activeTab === 'dividend-projection' && (
              <DividendProjectionTab />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
