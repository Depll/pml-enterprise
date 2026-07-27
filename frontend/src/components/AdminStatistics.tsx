import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

interface StatsData {
  today: { revenue: number; count: number };
  yesterday: { revenue: number; count: number };
  total: { revenue: number; count: number };
  ordersByWeekday: Array<{ day: string; count: number; revenue: number }>;
  topProducts: Array<{ name: string; quantity: number }>;
}

export const AdminStatistics: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await apiService.fetchStatistics();
        setStats(data);
      } catch (err) {
        console.error('Fehler beim Laden der Statistik:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="p-5 bg-slate-900 min-h-screen text-white font-sans flex justify-center items-center">
        <p className="text-slate-400 animate-pulse text-lg">📊 Lade Statistiken...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-5 bg-slate-900 min-h-screen text-white font-sans text-center">
        <p className="text-red-400 mb-4">Fehler beim Laden der Statistiken.</p>
        <button
          onClick={() => navigate('/kueche')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold cursor-pointer transition-colors"
        >
          ← Zurück zum Küchen-Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 bg-slate-900 min-h-screen text-white font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-wide">📊 Geschäfts-Statistiken</h2>
        <button
          onClick={() => navigate('/kueche')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold text-sm cursor-pointer transition-colors"
        >
          ← Zurück zum Küchen-Dashboard
        </button>
      </div>

      {/* KPI Kacheln */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-emerald-500 shadow-md">
          <span className="text-xs sm:text-sm text-slate-400 block font-medium">Umsatz Heute</span>
          <h3 className="mt-1 text-2xl font-extrabold text-emerald-400">
            {stats.today.revenue.toFixed(2).replace('.', ',')} €
          </h3>
          <span className="text-xs text-slate-300 font-mono mt-1 block">{stats.today.count} Bestellungen</span>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500 shadow-md">
          <span className="text-xs sm:text-sm text-slate-400 block font-medium">Umsatz Gestern</span>
          <h3 className="mt-1 text-2xl font-extrabold text-blue-400">
            {stats.yesterday.revenue.toFixed(2).replace('.', ',')} €
          </h3>
          <span className="text-xs text-slate-300 font-mono mt-1 block">{stats.yesterday.count} Bestellungen</span>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-amber-500 shadow-md">
          <span className="text-xs sm:text-sm text-slate-400 block font-medium">Umsatz Gesamt</span>
          <h3 className="mt-1 text-2xl font-extrabold text-amber-400">
            {stats.total.revenue.toFixed(2).replace('.', ',')} €
          </h3>
          <span className="text-xs text-slate-300 font-mono mt-1 block">{stats.total.count} Bestellungen</span>
        </div>
      </div>

      {/* Detail-Gitter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wochentage Tabelle */}
        <div className="bg-slate-800 p-5 rounded-lg shadow-md border border-slate-700">
          <h3 className="text-amber-400 font-bold text-lg mb-4 tracking-wide">📅 Bestellungen nach Wochentag</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs">
                  <th className="pb-2">Wochentag</th>
                  <th className="pb-2">Bestellungen</th>
                  <th className="pb-2 text-right">Umsatz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {stats.ordersByWeekday.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-2.5 font-bold text-slate-200">{row.day}</td>
                    <td className="py-2.5 font-mono text-slate-300">{row.count}x</td>
                    <td className="py-2.5 font-mono font-bold text-emerald-400 text-right">
                      {row.revenue.toFixed(2).replace('.', ',')} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 Renner Gerichte */}
        <div className="bg-slate-800 p-5 rounded-lg shadow-md border border-slate-700">
          <h3 className="text-amber-400 font-bold text-lg mb-4 tracking-wide">🍕 Top 5 Beliebteste Gerichte</h3>
          <div className="space-y-3">
            {stats.topProducts.length === 0 ? (
              <p className="text-slate-400 italic text-sm">Noch keine Bestelldaten vorhanden.</p>
            ) : (
              stats.topProducts.map((p, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-extrabold font-mono text-base">#{i + 1}</span>
                    <span className="font-semibold text-slate-200 text-sm">{p.name}</span>
                  </div>
                  <span className="bg-slate-800 px-3 py-1 rounded text-xs font-bold font-mono text-blue-400 border border-slate-700">
                    {p.quantity}x verkauft
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};