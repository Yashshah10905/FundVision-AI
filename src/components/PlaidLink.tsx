import React, { useCallback, useState, useEffect } from 'react';
import { usePlaidLink, PlaidLinkOptions } from 'react-plaid-link';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../context/NotificationContext';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import axios from 'axios';

interface PlaidLinkProps {
  onSuccess?: (accessToken?: string) => void;
}

export default function PlaidLink({ onSuccess }: PlaidLinkProps) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateToken = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const response = await axios.post('/api/create_link_token', { userId: user.id });
      setLinkToken(response.data.link_token);
    } catch (err: any) {
      console.error('Error generating link token:', err);
      setError(err.response?.data?.error || 'Failed to initialize Plaid. Please check your API credentials.');
    }
  }, [user]);

  useEffect(() => {
    generateToken();
  }, [generateToken]);

  const handleOnSuccess = useCallback(async (public_token: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/set_access_token', { public_token });
      const { institution_name, accounts, transactions } = response.data;
      
      if (!user) throw new Error('User not authenticated');

      // 1. Save Bank Connection
      const { data: connection, error: connError } = await supabase
        .from('bank_connections')
        .insert([{
          user_id: user.id,
          bank_name: institution_name,
          account_type: accounts[0]?.subtype || 'checking',
          connection_status: 'active'
        }])
        .select()
        .single();

      if (connError) throw connError;

      // 2. Save Initial Transactions
      if (transactions && transactions.length > 0) {
        const formattedTransactions = transactions.map((tx: any) => ({
          user_id: user.id,
          amount: Math.abs(tx.amount),
          type: tx.amount > 0 ? 'expense' : 'income',
          category: tx.category?.[0] || 'General',
          date: tx.date,
          description: tx.name,
          bank_connection_id: connection.id
        }));

        const { error: txError } = await supabase
          .from('transactions')
          .insert(formattedTransactions);

        if (txError) console.error('Error saving initial transactions:', txError);
      }
      
      addNotification({
        type: 'system',
        title: 'Bank Connected',
        message: `Successfully connected ${institution_name} to FundVision.`,
      });

      if (transactions && transactions.length > 0) {
        addNotification({
          type: 'transaction',
          title: 'Transactions Synced',
          message: `${transactions.length} new transactions have been imported.`,
        });
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error in Plaid Link flow:', err);
      setError('Failed to sync account data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onSuccess, user]);

  const config: PlaidLinkOptions = {
    token: linkToken!,
    onSuccess: handleOnSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => open()}
        disabled={!ready || loading}
        className="flex items-center gap-2 px-6 py-3 bg-primary-container text-white font-bold rounded-xl shadow-lg hover:bg-primary-container/90 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <LinkIcon className="w-5 h-5" />
        )}
        <span>{loading ? 'Connecting...' : 'Connect Bank Account'}</span>
      </button>
      {error && (
        <p className="text-[10px] font-black text-error uppercase tracking-widest text-center max-w-[200px]">
          {error}
        </p>
      )}
      {!linkToken && !error && (
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
          Initializing Secure Link...
        </p>
      )}
    </div>
  );
}
