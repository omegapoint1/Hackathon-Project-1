interface BalanceCardProps {
  title: string;
  amount: number | null;
  loading: boolean;
  currency: string;
  icon: 'wallet' | 'savings' | 'total';
  rate?: number | null;
}

export function BalanceCard({ title, amount, loading, currency, icon, rate }: BalanceCardProps) {
  const getIcon = () => {
    switch (icon) {
      case 'wallet':
        return (
          <div className="p-3 bg-nim-blue/10 rounded-lg">
            <svg className="w-6 h-6 text-nim-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        );
      case 'savings':
        return (
          <div className="p-3 bg-nim-green/10 rounded-lg">
            <svg className="w-6 h-6 text-nim-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'total':
        return (
          <div className="p-3 bg-nim-orange/10 rounded-lg">
            <svg className="w-6 h-6 text-nim-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        );
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-body text-sm font-medium text-nim-brown/60">{title}</h3>
        {getIcon()}
      </div>
      
      <div className="space-y-2">
        <div className="font-display text-2xl font-bold text-nim-black">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-nim-cream rounded w-3/4"></div>
            </div>
          ) : (
            formatCurrency(amount)
          )}
        </div>
        
        {rate !== null && rate !== undefined && !loading && (
          <div className="flex items-center text-sm text-nim-green">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {rate.toFixed(2)}% APY
          </div>
        )}
      </div>
    </div>
  );
}