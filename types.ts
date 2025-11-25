
export interface FinancialData {
  ticker: string;
  name: string;
  assetClass?: AssetCategory; // Added for precise classification (ACAO, FII, ETF, BDR)
  currency: string;
  currentPrice: number;
  sector: string;
  description: string;
  
  // Fundamentals
  eps: number; // Earnings Per Share (LPA)
  bvps: number; // Book Value Per Share (VPA)
  dividendYield: number; // Percentage (e.g., 5.5 for 5.5%)
  peRatio: number; // P/E (P/L)
  pbRatio: number; // P/B (P/VP)
  roe: number; // Return on Equity
  debtToEquity: number; // Dívida Líquida / PL
  netMargin: number; // Margem Líquida
  lastDividend: number; // Dividendo por ação (últimos 12m)
  
  // New: Historical Dividends
  dividendHistory: DividendHistoryItem[];

  // New: Sector Specific Metrics (Dynamic)
  sectorMetrics: SectorMetric[];

  // For DCF/Growth estimations (can be estimated by AI if not found)
  freeCashFlowPerShare: number;
  revenueGrowth3y: number;
}

export interface SectorMetric {
  label: string;
  value: string | number;
  unit?: string;
  tooltip?: string;
}

export interface DividendHistoryItem {
  month: string; // e.g., "Jan/24"
  value: number;
  type?: string; // "Dividendo" or "JCP"
}

export interface AnalysisResult {
  data: FinancialData;
  groundingUrls: string[];
}

export interface DividendProjectionResult {
  ticker: string;
  latestReportDate: string;
  reportHighlights: string; // Markdown summary of the report
  reportedNetIncome: number; // Lucro Liquido reportado
  reportedRevenue: number; // Receita reportada
  sharesOutstanding: number; // Numero de acoes
  payoutRatio: number; // %
  projectedDividendPerShare: number; // Calculated by AI
  reasoning: string; // The AI's thinking process summary
  riskFactors: string;
}

export interface ValuationParams {
  grahamConstant: number; // Default 22.5
  bazinYieldTarget: number; // Default 6%
  gordonGrowthRate: number; // Default 2%
  gordonRequiredReturn: number; // Default 10%
  dcfGrowthRate: number; // Default 5%
  dcfDiscountRate: number; // Default 10%
  dcfYears: number; // Default 10
  marginOfSafety: number; // Default 30%
}

// Portfolio Types
export type AssetCategory = 'ACAO' | 'FII' | 'ETF' | 'BDR';

export interface PortfolioItem {
  ticker: string;
  category: AssetCategory;
  sector?: string; // For FIIs (Segmento) and Stocks
  quantity: number;
  averagePrice: number; // Preço Médio
  currentPrice: number;
  
  // Fundamentals for columns
  dy?: number; // Dividend Yield %
  pvp?: number; // P/VP
  pl?: number; // P/L
  roe?: number; // ROE %
  payout?: number; // Payout %
}

export interface MarketTickerItem {
  ticker: string;
  price: number;
  change: number;
}
