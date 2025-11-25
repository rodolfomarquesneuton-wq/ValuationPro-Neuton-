
import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { getMarketOverview } from '../services/geminiService';
import { MarketTickerItem } from '../types';

interface MarketTickerProps {
  onTickerClick: (ticker: string) => void;
}

const INITIAL_FALLBACK: MarketTickerItem[] = [
  { ticker: 'IBOV', price: 128500, change: 0.00 },
  { ticker: 'USDBRL', price: 5.15, change: 0.00 },
  { ticker: 'PETR4', price: 41.50, change: 0.00 },
  { ticker: 'VALE3', price: 60.80, change: 0.00 },
  { ticker: 'BTC', price: 350000, change: 0.00 },
];

export const MarketTicker: React.FC<MarketTickerProps> = ({ onTickerClick }) => {
  const [tickerItems, setTickerItems] = useState<MarketTickerItem[]>(INITIAL_FALLBACK);
  const [loading, setLoading] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const autoScrollSpeed = 1; // Pixels per frame
  const animationFrameId = useRef<number>(0);
  const isPaused = useRef(false);

  // Fetch Real Data on Mount
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const data = await getMarketOverview();
        if (mounted && data.length > 0) {
          setTickerItems(data);
        }
      } catch (err) {
        console.error("Failed to load ticker", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  // Infinite Scroll Logic
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scroll = () => {
      if (!isPaused.current && !isDragging.current && scrollContainer) {
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
          scrollContainer.scrollLeft = 0;
        } else {
          scrollContainer.scrollLeft += autoScrollSpeed;
        }
      }
      animationFrameId.current = requestAnimationFrame(scroll);
    };

    animationFrameId.current = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId.current);
  }, [tickerItems]); // Restart if items change

  // Mouse/Touch Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    isPaused.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    isPaused.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    isPaused.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX.current) * 2; // Scroll-fast
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    isPaused.current = true;
    startX.current = e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    isPaused.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const x = e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX.current) * 2;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  // Duplicate items for infinite loop illusion
  const displayItems = [...tickerItems, ...tickerItems];

  return (
    <div className="w-full bg-slate-900 text-white border-b border-slate-800 relative h-10 flex items-center select-none">
      
      {/* Loading Indicator Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-900 z-20 flex items-center justify-center gap-2 text-xs text-slate-400">
          <RefreshCw className="animate-spin w-3 h-3" /> Atualizando cotações...
        </div>
      )}

      {/* Gradients */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"></div>

      <div 
        ref={scrollRef}
        className="flex overflow-x-hidden whitespace-nowrap cursor-grab active:cursor-grabbing w-full h-full items-center"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseEnter={() => isPaused.current = true}
      >
        {displayItems.map((item, index) => (
          <button 
            key={`${item.ticker}-${index}`} 
            onClick={() => !isDragging.current && onTickerClick(item.ticker)}
            className="inline-flex items-center mx-6 text-sm font-mono flex-shrink-0 hover:bg-slate-800 px-2 py-1 rounded transition-colors"
          >
            <span className="font-bold text-slate-300 mr-2">{item.ticker}</span>
            <span className="mr-2 text-slate-400">
               {['BTC', 'IBOV', 'IFIX'].includes(item.ticker) ? '' : 'R$'}
               {item.price.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
            <span className={`flex items-center text-xs font-bold ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {item.change >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
              {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
