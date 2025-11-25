import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC<{ ticker: string }> = ({ ticker }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4 text-slate-600 animate-in fade-in duration-500">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-800">Analisando {ticker}...</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          A IA está consultando bases de dados financeiras recentes, relatórios e indicadores fundamentalistas para compor o valuation.
        </p>
      </div>
    </div>
  );
};
