
import React, { useState } from 'react';
import { PortfolioItem, AssetCategory } from '../types';
import { generateMockPortfolio, analyzeTicker } from '../services/geminiService';
import { Loader2, Wallet, Lock, TrendingUp, DollarSign, PieChart, Pencil, Check, X, Trash2, Plus } from 'lucide-react';

const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPercent = (val: number | undefined) => val !== undefined && val !== null ? `${val.toFixed(2)}%` : '-';

interface PortfolioDashboardProps {
  portfolio: PortfolioItem[];
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioItem[]>>;
}

export const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ portfolio, setPortfolio }) => {
  const [isConnected, setIsConnected] = useState(portfolio.length > 0);
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ quantity: string; averagePrice: string }>({ quantity: '', averagePrice: '' });

  const [isAdding, setIsAdding] = useState(false);
  const [newAssetTicker, setNewAssetTicker] = useState('');
  const [addingLoading, setAddingLoading] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf.length < 11) return;
    setLoading(true);
    try {
      const data = await generateMockPortfolio(cpf);
      setPortfolio(data);
      setIsConnected(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (item: PortfolioItem) => {
    setEditingTicker(item.ticker);
    setEditForm({ 
      quantity: item.quantity.toString(), 
      averagePrice: item.averagePrice.toString() 
    });
  };

  const cancelEditing = () => {
    setEditingTicker(null);
    setEditForm({ quantity: '', averagePrice: '' });
  };

  const saveEdit = () => {
    if (!editingTicker) return;
    const qty = parseFloat(editForm.quantity);
    const avgPrice = parseFloat(editForm.averagePrice);

    if (isNaN(qty) || isNaN(avgPrice)) return;

    setPortfolio(prev => prev.map(item => 
      item.ticker === editingTicker 
        ? { ...item, quantity: qty, averagePrice: avgPrice }
        : item
    ));
    setEditingTicker(null);
  };

  const deleteAsset = (ticker: string) => {
    if (confirm(`Deseja realmente remover ${ticker} da carteira?`)) {
      setPortfolio(prev => prev.filter(p => p.ticker !== ticker));
    }
  };

  const handleAddAsset = async () => {
    if (!newAssetTicker) return;
    setAddingLoading(true);
    try {
      const analysis = await analyzeTicker(newAssetTicker);
      const data = analysis.data;
      
      let category: AssetCategory = data.assetClass || 'ACAO';
      
      if (!data.assetClass) {
          if (data.ticker.endsWith('33') || data.ticker.endsWith('34')) category = 'BDR';
          else if (data.ticker.endsWith('11')) {
              const isLikelyETF = /ETF|Index|Indice|Gold|S&P|Small/i.test(data.name || '') || /ETF|Index/i.test(data.description || '');
              category = isLikelyETF ? 'ETF' : 'FII';
          }
      }
      
      const newItem: PortfolioItem = {
        ticker: data.ticker,
        category: category,
        sector: data.sector,
        quantity: 1,
        averagePrice: data.currentPrice,
        currentPrice: data.currentPrice,
        dy: data.dividendYield,
        pvp: data.pbRatio,
        pl: data.peRatio,
        roe: data.roe,
        payout: 0 
      };

      setPortfolio(prev => [...prev, newItem]);
      setIsAdding(false);
      setNewAssetTicker('');
    } catch (error) {
      console.error(error);
      alert('Não foi possível encontrar o ativo. Verifique o ticker.');
    } finally {
      setAddingLoading(false);
    }
  };

  const totalBalance = portfolio.reduce((acc, item) => acc + (item.currentPrice * item.quantity), 0);

  const AssetTable = ({ category, title, columns }: { category: AssetCategory, title: string, columns: string[] }) => {
    const items = portfolio.filter(p => p.category === category);
    if (items.length === 0) return null;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-slate-50 dark:bg-slate-700 px-6 py-4 border-b border-slate-100 dark:border-slate-600 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
            {category === 'ACAO' ? <TrendingUp size={18} className="text-blue-600 dark:text-blue-400"/> : 
             category === 'FII' ? <DollarSign size={18} className="text-green-600 dark:text-green-400"/> :
             <PieChart size={18} className="text-purple-600 dark:text-purple-400"/>}
            {title}
          </h3>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-300">
            {formatCurrency(items.reduce((acc, i) => acc + (i.currentPrice * i.quantity), 0))}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-900 dark:text-slate-100">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold uppercase text-xs">
              <tr>
                {columns.map((col, idx) => <th key={idx} className="px-4 py-3 whitespace-nowrap">{col}</th>)}
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {items.map((item) => {
                const isEditing = editingTicker === item.ticker;
                const balance = item.currentPrice * item.quantity;
                const priceVar = ((item.currentPrice - item.averagePrice) / item.averagePrice) * 100;
                const rentabReal = balance - (item.averagePrice * item.quantity); 
                const yoc = item.dy ? (item.currentPrice * (item.dy / 100) / item.averagePrice) * 100 : 0;
                const share = (balance / totalBalance) * 100;

                return (
                  <tr key={item.ticker} className={`transition-colors ${isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <td className="px-4 py-3 font-bold">{item.ticker}</td>
                    {(category === 'FII' || category === 'ACAO') && (
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.sector || '-'}</td>
                    )}
                    
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                          className="w-20 p-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      ) : item.quantity}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {isEditing ? (
                        <input 
                          type="number" 
                          step="0.01"
                          value={editForm.averagePrice}
                          onChange={(e) => setEditForm({...editForm, averagePrice: e.target.value})}
                          className="w-24 p-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      ) : formatCurrency(item.averagePrice)}
                    </td>

                    <td className="px-4 py-3 font-medium">{formatCurrency(item.currentPrice)}</td>
                    
                    <td className={`px-4 py-3 font-medium ${priceVar >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                       {!isEditing && (priceVar > 0 ? '+' : '') + formatPercent(priceVar)}
                    </td>
                    <td className={`px-4 py-3 font-medium ${rentabReal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                       {!isEditing && formatCurrency(rentabReal)}
                    </td>
                    <td className="px-4 py-3 font-bold">{!isEditing && formatCurrency(balance)}</td>
                    
                    {category === 'ACAO' && (
                        <>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatPercent(item.payout)}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.pl?.toFixed(2) || '-'}</td>
                        </>
                    )}
                    
                    {(category === 'ACAO' || category === 'FII') && (
                         <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.pvp?.toFixed(2) || '-'}</td>
                    )}

                    {(category === 'ACAO' || category === 'FII') && (
                        <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">{formatPercent(item.dy)}</td>
                    )}

                    {(category === 'ACAO' || category === 'FII') && (
                         <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{!isEditing && formatPercent(yoc)}</td>
                    )}

                    {category === 'ACAO' && (
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatPercent(item.roe)}</td>
                    )}

                    <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-medium">{!isEditing && formatPercent(share)}</td>
                    
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                              <Check size={16} />
                            </button>
                            <button onClick={cancelEditing} className="p-1 text-red-600 hover:bg-red-100 rounded">
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditing(item)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => deleteAsset(item.ticker)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
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

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto mt-12 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="bg-blue-100 dark:bg-blue-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="text-blue-600 dark:text-blue-400 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Importar Carteira B3</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Conecte-se à Área do Investidor da B3 para importar automaticamente suas ações, FIIs e outros ativos.
          </p>
          
          <form onSubmit={handleConnect} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CPF</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <Lock className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading || cpf.length < 11}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Conectar Conta Segura'}
            </button>
          </form>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-6 leading-relaxed">
            <Lock size={12} className="inline mr-1" />
            <strong>Nota de Segurança:</strong> Este aplicativo roda em modo demonstrativo. 
            A conexão real com a B3 exige autenticação via backend. 
            Os dados exibidos a seguir serão uma <strong>simulação</strong> baseada em preços reais de mercado, 
            que você poderá <strong>editar manualmente</strong> para refletir sua carteira real.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciar Ativos</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Edite seus ativos e acompanhe os preços.</p>
         </div>
         
         <div className="flex gap-2 w-full md:w-auto">
            {isAdding ? (
               <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm w-full md:w-auto">
                  <input 
                    type="text" 
                    placeholder="Ticker (ex: TAEE11)" 
                    className="outline-none text-sm px-2 py-1 w-full md:w-32 uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                    value={newAssetTicker}
                    onChange={e => setNewAssetTicker(e.target.value.toUpperCase())}
                  />
                  <button onClick={handleAddAsset} disabled={addingLoading} className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 disabled:opacity-50">
                     {addingLoading ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} />}
                  </button>
                  <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-red-500 p-1.5">
                     <X size={16} />
                  </button>
               </div>
            ) : (
               <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors w-full md:w-auto justify-center">
                  <Plus size={16} /> Adicionar Ativo
               </button>
            )}
         </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 p-3 rounded-lg text-sm flex items-start gap-2">
        <Lock size={16} className="mt-0.5 flex-shrink-0" />
        <p>
          Os dados abaixo foram simulados para demonstração. 
          Utilize o botão de edição (<Pencil size={12} className="inline"/>) para ajustar a <strong>Quantidade</strong> e o <strong>Preço Médio</strong> conforme sua nota de corretagem real.
        </p>
      </div>
      
      <AssetTable 
        category="FII" 
        title="Fundos Imobiliários (FIIs)" 
        columns={['Ticker', 'Segmento', 'Qtd', 'Preço Médio', 'Preço Atual', 'Var %', 'Rentab. Real', 'Saldo', 'P/VP', 'D.Y.', 'Y.o.C.', '% Carteira']}
      />

      <AssetTable 
        category="ACAO" 
        title="Ações" 
        columns={['Ticker', 'Setor', 'Qtd', 'Preço Médio', 'Preço Atual', 'Var %', 'Rentab. Real', 'Saldo', 'Payout', 'P/L', 'P/VP', 'D.Y.', 'Y.o.C.', 'ROE', '% Carteira']}
      />

      <AssetTable 
        category="ETF" 
        title="ETFs" 
        columns={['Ticker', 'Qtd', 'Preço Médio', 'Preço Atual', 'Var %', 'Rentab. Real', 'Saldo', '% Carteira']}
      />

      <AssetTable 
        category="BDR" 
        title="BDRs" 
        columns={['Ticker', 'Qtd', 'Preço Médio', 'Preço Atual', 'Var %', 'Rentab. Real', 'Saldo', '% Carteira']}
      />

    </div>
  );
};
