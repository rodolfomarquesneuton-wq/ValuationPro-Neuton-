
import { GoogleGenAI } from "@google/genai";
import { FinancialData, AnalysisResult, PortfolioItem, AssetCategory, DividendProjectionResult, MarketTickerItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to extract JSON from mixed text
const extractJSON = (text: string): string => {
  try {
    // First try to find code block
    const codeBlockMatch = text.match(/```json([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }
    // Fallback: find first '{' and last '}'
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    return "{}";
  } catch (e) {
    return "{}";
  }
};

// Helper for Array JSON
const extractJSONArray = (text: string): string => {
  try {
     const codeBlockMatch = text.match(/```json([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    return "[]";
  } catch (e) {
    return "[]";
  }
};

// Helper to strictly parse financial numbers from potential string mess
const parseFinancialNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  
  let str = String(val).toLowerCase();
  
  // Handle "bi", "mi"
  let multiplier = 1;
  if (str.includes('bi')) multiplier = 1000000000;
  else if (str.includes('mi')) multiplier = 1000000;
  
  // Remove currency, text, then swap comma to dot
  str = str.replace(/[^\d,\.-]/g, ''); // keep digits, comma, dot, minus
  
  // Brazilian format 1.000,00 vs US 1,000.00
  // If many dots, it's thousands separator
  if ((str.match(/\./g) || []).length > 1) {
    str = str.replace(/\./g, ''); // remove thousands dots
    str = str.replace(',', '.'); // comma is decimal
  } else if (str.includes(',') && str.includes('.')) {
    // 1.000,00
    if (str.indexOf('.') < str.indexOf(',')) {
      str = str.replace(/\./g, '');
      str = str.replace(',', '.');
    } 
    // 1,000.00
    else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  
  return (parseFloat(str) || 0) * multiplier;
};

export const analyzeTicker = async (ticker: string): Promise<AnalysisResult> => {
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    Atue como um analista financeiro sênior especializado em Value Investing.
    Preciso dos dados fundamentalistas mais recentes para o ativo: "${ticker}".
    
    Identifique a classe do ativo com precisão:
    - ACAO (Ex: PETR4, VALE3, AAPL)
    - FII (Fundo Imobiliário, Ex: HGLG11, MXRF11)
    - ETF (Exchange Traded Fund, Ex: BOVA11, IVVB11, GOLD11, XINA11)
    - BDR (Brazilian Depositary Receipt, Ex: AAPL34, NVDC34)

    Use o Google Search para encontrar os dados mais atuais possíveis.
    
    IMPORTANTE: 
    1. Pesquise o histórico exato de pagamentos de proventos (Dividendos, JCP, Rendimentos) dos ÚLTIMOS 12 MESES e liste em "dividendHistory".
    2. IDENTIFIQUE O SETOR (Ex: Elétrico, Bancário, Varejo, Saneamento, Logística, Papel e Celulose, etc).
    3. Com base no setor identificado, forneça 4 a 6 INDICADORES ESPECÍFICOS CRUCIAIS (KPIs) para analisar este tipo de negócio no campo "sectorMetrics".
       Exemplos:
       - Bancos: Índice de Basileia, Índice de Eficiência, PDD/Carteira.
       - Varejo: SSS (Vendas Mesmas Lojas), Giro de Estoque, Margem Bruta.
       - Elétricas/Saneamento: Dívida Líq/EBITDA, CAGR Receita, Margem EBITDA.
       - FIIs: Vacância Física, Vacância Financeira, Cap Rate, Valor p/ m².
       - Mineradoras/Commodities: Cash Cost, Produção total.

    Retorne APENAS um objeto JSON válido. Não use blocos de código markdown. Apenas o texto JSON raw.
    O JSON deve seguir estritamente esta estrutura:
    {
      "ticker": "${ticker.toUpperCase()}",
      "name": "Nome da Empresa",
      "assetClass": "ACAO" | "FII" | "ETF" | "BDR",
      "currency": "BRL" ou "USD",
      "currentPrice": number (preço atual),
      "sector": "Setor de atuação específico",
      "description": "Breve descrição do negócio (max 150 chars)",
      "eps": number (Lucro por Ação. Se for FII use o Rendimento Médio Mensal),
      "bvps": number (Valor Patrimonial por Ação/Cota),
      "dividendYield": number (Percentual anual, ex: 8.5 para 8.5%),
      "lastDividend": number (Valor total SOMADO de proventos pagos nos ultimos 12 meses por ação),
      "dividendHistory": [
         { "month": "Mês/Ano ex: Jan/24", "value": number, "type": "Dividendo" | "JCP" | "Rendimento" }
      ],
      "sectorMetrics": [
        { "label": "Nome do Indicador", "value": "Valor formatado", "unit": "% ou R$ ou x", "tooltip": "Explicação breve" }
      ],
      "peRatio": number (P/L),
      "pbRatio": number (P/VP),
      "roe": number (Return on Equity em %),
      "debtToEquity": number (Dívida Líquida / Patrimônio Líquido. Se FII use 0),
      "netMargin": number (Margem Líquida em %),
      "freeCashFlowPerShare": number (Fluxo de Caixa Livre por Ação estimado),
      "revenueGrowth3y": number (Crescimento médio de receita 3 anos em %)
    }

    Se algum dado não for encontrado, faça sua melhor estimativa baseada nos dados financeiros recentes ou use 0 se impossível determinar.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = extractJSON(response.text || "{}");
    const parsedData = JSON.parse(text);
    
    // Extract grounding metadata
    const groundingUrls: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          groundingUrls.push(chunk.web.uri);
        }
      });
    }

    // Clean and validate data - STRICT NUMBER CONVERSION TO PREVENT CRASHES
    const cleanData: FinancialData = {
      ticker: parsedData.ticker || ticker.toUpperCase(),
      name: parsedData.name || 'Unknown',
      assetClass: parsedData.assetClass || 'ACAO',
      currency: parsedData.currency || 'BRL',
      sector: parsedData.sector || 'Geral',
      description: parsedData.description || '',
      
      // Fundamentals (default to 0 if missing/invalid to prevent toFixed error)
      currentPrice: parseFinancialNumber(parsedData.currentPrice),
      eps: parseFinancialNumber(parsedData.eps),
      bvps: parseFinancialNumber(parsedData.bvps),
      dividendYield: parseFinancialNumber(parsedData.dividendYield),
      peRatio: parseFinancialNumber(parsedData.peRatio),
      pbRatio: parseFinancialNumber(parsedData.pbRatio),
      roe: parseFinancialNumber(parsedData.roe),
      debtToEquity: parseFinancialNumber(parsedData.debtToEquity),
      netMargin: parseFinancialNumber(parsedData.netMargin),
      lastDividend: parseFinancialNumber(parsedData.lastDividend),
      freeCashFlowPerShare: parseFinancialNumber(parsedData.freeCashFlowPerShare),
      revenueGrowth3y: parseFinancialNumber(parsedData.revenueGrowth3y),
      
      // Arrays
      dividendHistory: Array.isArray(parsedData.dividendHistory) ? parsedData.dividendHistory.map((d: any) => ({
        ...d,
        value: parseFinancialNumber(d.value)
      })) : [],
      sectorMetrics: Array.isArray(parsedData.sectorMetrics) ? parsedData.sectorMetrics : [],
    };

    return {
      data: cleanData,
      groundingUrls: Array.from(new Set(groundingUrls)).slice(0, 5)
    };

  } catch (error) {
    console.error("Error fetching financial data:", error);
    throw new Error("Falha ao obter dados financeiros. Verifique o Ticker ou tente novamente.");
  }
};

export const getDividendProjection = async (ticker: string): Promise<DividendProjectionResult> => {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  
  const prompt = `
    Você é um analista financeiro sênior especialista em Valuation e Projeção de Fluxos de Caixa.
    Estamos no ano de ${currentYear}.
    
    OBJETIVO CRÍTICO: Analisar a situação atual do ativo "${ticker}" para projetar dividendos.

    Estratégia de Busca:
    1. PRIORIZE encontrar dados de ${currentYear} (Ex: Fatos Relevantes recentes, Prévias Operacionais, Resultados 1T${currentYear} se houver).
    2. CASO NÃO HAJA dados completos de ${currentYear}, UTILIZE os resultados consolidados de ${lastYear} (ex: 4T${lastYear}) como base sólida.
    3. NÃO DESCARTE o histórico recente (${lastYear}) se ele for útil para entender a tendência ou a política de payout.
    4. Procure por "Guidance ${currentYear}" ou "Política de Dividendos" atualizada.

    Se o ativo for PETR4 ou VALE3, procure o "Plano Estratégico" vigente em ${currentYear}.

    Analise:
    1. Data e Período do documento mais recente encontrado.
    2. Lucro Líquido Recorrente mais recente (ou Resultado Operacional para FIIs).
    3. Payout Ratio praticado recentemente ou política de dividendos oficial vigente.
    4. Guidance da diretoria para o ano de ${currentYear}.

    Retorne APENAS um JSON com a seguinte estrutura (sem texto adicional antes ou depois):
    {
      "ticker": "${ticker.toUpperCase()}",
      "latestReportDate": "String (Ex: 4T${lastYear} ou 1T${currentYear}, divulgado em Mês/Ano)",
      "reportHighlights": "String (Markdown). Resumo dos pontos principais DO RELATÓRIO MAIS RECENTE DISPONÍVEL que afetam dividendos.",
      "reportedNetIncome": Number (Lucro/Resultado reportado ABSOLUTO em unidades monetárias. Ex: 35000000000 para 35bi. NÃO use texto),
      "reportedRevenue": Number (Receita reportada absoluta),
      "sharesOutstanding": Number (Numero total de ações/cotas atualizado, valor absoluto. Ex: 13000000000),
      "payoutRatio": Number (Percentual de 0 a 100. Se FII costuma ser 95%),
      "projectedDividendPerShare": Number (Sua estimativa para o próximo provento unitário com base na tendência),
      "reasoning": "String (Markdown). Explique o racional, mencionando se usou dados de ${currentYear} ou ${lastYear}.",
      "riskFactors": "String. Riscos específicos para ${currentYear}."
    }
    
    IMPORTANTE: Retorne APENAS NÚMEROS PUROS nos campos numéricos. Não use "35bi" ou "R$ 10,00". Use 35000000000 e 10.00.
  `;

  // Fallback function for parsing the result
  const parseResult = (text: string): DividendProjectionResult => {
     const jsonText = extractJSON(text);
     const parsedData = JSON.parse(jsonText);
     return {
        ...parsedData,
        reportedNetIncome: parseFinancialNumber(parsedData.reportedNetIncome),
        reportedRevenue: parseFinancialNumber(parsedData.reportedRevenue),
        sharesOutstanding: parseFinancialNumber(parsedData.sharesOutstanding),
        payoutRatio: parseFinancialNumber(parsedData.payoutRatio),
        projectedDividendPerShare: parseFinancialNumber(parsedData.projectedDividendPerShare)
     } as DividendProjectionResult;
  };

  try {
    // Attempt 1: Try High Intelligence Model (Thinking)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });

    return parseResult(response.text || "{}");
    
  } catch (error: any) {
    console.warn("Gemini 3 Pro failed, attempting fallback to Flash:", error);

    // Attempt 2: Fallback to Flash 2.5 if 3.0 fails (e.g. 403 Forbidden or Quota)
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.1 // Low temp for logic
          },
        });
        
        return parseResult(response.text || "{}");

    } catch (fallbackError) {
        console.error("Error calculating dividend projection (Fallback):", fallbackError);
        throw new Error("Não foi possível analisar os relatórios. O modelo pode ter gerado uma resposta inválida ou o serviço está indisponível.");
    }
  }
};

export const getMarketOverview = async (): Promise<MarketTickerItem[]> => {
  const model = 'gemini-2.5-flash';
  // List of diverse assets to track
  const tickers = ['IBOV', 'USDBRL', 'CDI', 'PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'WEGE3', 'HGLG11', 'MXRF11', 'KNRI11', 'IVVB11', 'BTC', 'IFIX'];
  
  const prompt = `
    Use a Google Search para encontrar a COTAÇÃO ATUAL (Preço) e a VARIAÇÃO DIÁRIA (%) dos seguintes ativos agora:
    ${tickers.join(', ')}.

    Retorne APENAS um Array JSON com os dados reais encontrados.
    Estrutura:
    [
      { "ticker": "IBOV", "price": number, "change": number (ex: 0.5 ou -1.2) },
      { "ticker": "USDBRL", "price": number, "change": number },
      ...
    ]
  `;

  try {
     const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = extractJSONArray(response.text || "[]");
    const data = JSON.parse(text);

    return data.map((item: any) => ({
      ticker: item.ticker,
      price: parseFinancialNumber(item.price),
      change: parseFinancialNumber(item.change)
    }));

  } catch (e) {
    console.error("Error fetching market overview:", e);
    // Fallback to static mock if AI/Search fails
    return [
      { ticker: 'IBOV', price: 128500, change: 0.45 },
      { ticker: 'USDBRL', price: 5.15, change: -0.20 },
      { ticker: 'PETR4', price: 41.50, change: 1.25 },
      { ticker: 'VALE3', price: 60.80, change: -0.90 },
      { ticker: 'ITUB4', price: 34.20, change: 0.55 },
      { ticker: 'BBAS3', price: 58.10, change: 0.80 },
      { ticker: 'WEGE3', price: 38.50, change: 1.10 },
      { ticker: 'HGLG11', price: 162.50, change: 0.15 },
      { ticker: 'MXRF11', price: 10.45, change: 0.10 },
      { ticker: 'IVVB11', price: 298.50, change: 0.60 },
      { ticker: 'BTC', price: 350000, change: 2.50 },
      { ticker: 'IFIX', price: 3380, change: 0.05 },
    ];
  }
}

export const generateMockPortfolio = async (cpf: string): Promise<PortfolioItem[]> => {
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    Gere um JSON contendo uma carteira de investimentos brasileira realista para simulação.
    A carteira deve conter:
    - 3 Ações Brasileiras (ex: VALE3, BBAS3, WEGE3) -> category: "ACAO"
    - 3 Fundos Imobiliários (ex: HGLG11, MXRF11, KNRI11) -> category: "FII"
    - 1 ETF (ex: IVVB11 ou BOVA11) -> category: "ETF"
    - 1 BDR (ex: AAPL34 ou NVDC34) -> category: "BDR"

    Para cada ativo, use o Google Search para encontrar o PREÇO ATUAL (currentPrice) e indicadores fundamentalistas REAIS e ATUAIS (DY, P/VP, P/L, ROE, Payout).
    Invente uma "quantity" (entre 10 e 500) e um "averagePrice" (preço médio) que seja realista (um pouco abaixo ou acima do preço atual para gerar variação).
    
    CERTIFIQUE-SE DE QUE O CAMPO assetClass/category SEJA PREENCHIDO CORRETAMENTE (ACAO, FII, ETF, BDR).

    Retorne APENAS um Array JSON. Estrutura de cada item:
    {
      "ticker": "STRING",
      "category": "ACAO" | "FII" | "ETF" | "BDR",
      "sector": "STRING", // Para FIIs coloque o Segmento (ex: Logística). Para Ações o setor.
      "quantity": NUMBER,
      "averagePrice": NUMBER,
      "currentPrice": NUMBER,
      "dy": NUMBER, // Dividend Yield anual %
      "pvp": NUMBER, // P/VP
      "pl": NUMBER, // P/L (apenas para Ações)
      "roe": NUMBER, // ROE % (apenas para Ações)
      "payout": NUMBER // Payout % (apenas para Ações)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const text = extractJSONArray(response.text || "[]");
    const data: PortfolioItem[] = JSON.parse(text);
    
    // Ensure numbers
    return data.map(item => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      averagePrice: Number(item.averagePrice) || 0,
      currentPrice: Number(item.currentPrice) || 0,
      dy: Number(item.dy) || 0,
      pvp: Number(item.pvp) || 0,
      pl: Number(item.pl) || 0,
      roe: Number(item.roe) || 0,
      payout: Number(item.payout) || 0
    }));
  } catch (error) {
    console.error("Error generating portfolio:", error);
    // Fallback mock data if AI fails
    return [
      { ticker: "VALE3", category: "ACAO", sector: "Mineração", quantity: 100, averagePrice: 65.50, currentPrice: 68.20, dy: 8.5, pvp: 1.2, pl: 6.5, roe: 18, payout: 40 },
      { ticker: "HGLG11", category: "FII", sector: "Logística", quantity: 50, averagePrice: 160.00, currentPrice: 165.50, dy: 9.2, pvp: 1.02 },
      { ticker: "IVVB11", category: "ETF", quantity: 20, averagePrice: 280.00, currentPrice: 305.00 },
    ] as PortfolioItem[];
  }
};

// Helper to mock historical data since we don't have a backend for history
export const generateDashboardHistory = (currentTotal: number, currentDividendsYearly: number) => {
  // 1. Net Worth History (Last 12 months)
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const historyData = [];
  let tempTotal = currentTotal * 0.85; // Start 15% lower 12 months ago
  
  for (let i = 0; i < 12; i++) {
    // Add random fluctuation and trend
    tempTotal = tempTotal * (1 + (Math.random() * 0.05 - 0.01)); 
    if (i === 11) tempTotal = currentTotal; // Ensure it matches current at the end
    
    historyData.push({
      month: months[i],
      value: tempTotal
    });
  }

  // 2. Dividends History
  const dividendData = [];
  // Distribute yearly dividends somewhat randomly across months
  for (let i = 0; i < 12; i++) {
    const baseShare = currentDividendsYearly / 12;
    const variation = baseShare * 0.4; // +/- 40% monthly variation
    const value = baseShare + (Math.random() * variation * (Math.random() > 0.5 ? 1 : -1));
    
    dividendData.push({
      month: months[i],
      value: Math.max(0, value)
    });
  }

  const yearlyDividendData = [
    { year: '2021', value: currentDividendsYearly * 0.6 },
    { year: '2022', value: currentDividendsYearly * 0.75 },
    { year: '2023', value: currentDividendsYearly * 0.85 },
    { year: '2024', value: currentDividendsYearly * 1.1 }, // Projected
  ];

  return {
    netWorthHistory: historyData,
    monthlyDividends: dividendData,
    yearlyDividends: yearlyDividendData
  };
};
