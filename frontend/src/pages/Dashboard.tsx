import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface DashboardMetrics {
    totalMuzakki: number;
    totalMustahiq: number;
    totalMasuk: number;
    totalKeluar: number;
    currentBalance: number;
    totalDistributedByMe?: number;
    totalDistributedByOthers?: number;
    recentTransactions: any[];
}

export const Dashboard = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await api.get('/dashboard/metrics');
                setMetrics(response.data);
            } catch (err) {
                setError('Failed to load dashboard metrics');
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (loading) return <div className="p-4 text-gray-500">Memuat metrik...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!metrics) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h2 className="text-3xl font-black text-slate-100">Ringkasan Operasional</h2>
                <p className="text-slate-400 mt-1">Status dan Statistik Penyaluran Zakat Terkini</p>
            </div>

            {/* Premium Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Saldo Terkini"
                    value={formatCurrency(metrics.currentBalance)}
                    glowing={true}
                />
                <MetricCard
                    title="Total Zakat Masuk"
                    value={formatCurrency(metrics.totalMasuk)}
                />
                <MetricCard
                    title="Total Zakat Keluar"
                    value={formatCurrency(metrics.totalKeluar)}
                />

                {user?.role === 'ADMIN' && (
                    <MetricCard
                        title="Muzakki Terdaftar"
                        value={metrics.totalMuzakki}
                    />
                )}

                {(user?.role === 'ADMIN' || user?.role === 'PEMBAGI') && (
                    <MetricCard
                        title="Mustahiq Terdaftar"
                        value={metrics.totalMustahiq}
                    />
                )}

                {metrics.totalDistributedByMe !== undefined && (
                    <>
                        <MetricCard
                            title="Disalurkan (Saya)"
                            value={formatCurrency(metrics.totalDistributedByMe)}
                        />
                        <MetricCard
                            title="Disalurkan (Lainnya)"
                            value={formatCurrency(metrics.totalDistributedByOthers || 0)}
                        />
                    </>
                )}
            </div>

            {/* Recent Transactions Table - Glassmorphism */}
            <div className="glass-card">
                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">
                            {user?.role === 'MUZAKKI' ? 'Penyaluran Zakat Terbaru' : 'Transaksi Terbaru'}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">Menampilkan aktivitas mutasi terakhir</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="glass-table-th">Tipe</th>
                                <th className="glass-table-th">Kategori</th>
                                <th className="glass-table-th">Jumlah</th>
                                <th className="glass-table-th">Petugas</th>
                                <th className="glass-table-th">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {metrics.recentTransactions?.map((trx, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="glass-table-td">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded border ${trx.type === 'IN'
                                            ? 'bg-slate-800/80 text-slate-300 border-slate-700'
                                            : 'bg-slate-800/50 text-slate-400 border-slate-700/50'
                                            }`}>
                                            {trx.type === 'IN' ? 'Zakat Masuk' : 'Penyaluran'}
                                        </span>
                                    </td>
                                    <td className="glass-table-td font-medium">
                                        {trx.category}
                                    </td>
                                    <td className="glass-table-td">
                                        <span className={`font-bold ${trx.type === 'IN' ? 'text-slate-200' : 'text-slate-400'}`}>
                                            {trx.type === 'IN' ? '+' : '-'}{formatCurrency(trx.amount)}
                                        </span>
                                    </td>
                                    <td className="glass-table-td text-slate-400">
                                        {trx.type === 'OUT' && trx.distributedByName ? trx.distributedByName : '-'}
                                    </td>
                                    <td className="glass-table-td text-slate-400">
                                        {new Date(trx.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                </tr>
                            ))}
                            {(!metrics.recentTransactions || metrics.recentTransactions.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                        Belum ada transaksi terbaru
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, glowing = false }: { title: string, value: string | number, glowing?: boolean }) => {
    // All monochrome variations
    const gradientClass = glowing
        ? 'from-slate-200 to-slate-400 text-slate-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
        : 'from-slate-300 to-slate-500 text-slate-300';

    const cardClass = glowing ? 'glass-card-glowing' : 'glass-card hover:bg-slate-800/80 transition-colors';

    return (
        <div className={`${cardClass} p-6 flex flex-col justify-between h-full min-h-[140px] group`}>
            {/* Top decorative dot */}
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${gradientClass.split(' ')[0]} ${gradientClass.split(' ')[1]} opacity-20 blur-xl rounded-full translate-x-1/2 -translate-y-1/2`}></div>

            <dt className="text-sm font-medium text-gray-400 relative z-10">{title}</dt>

            <dd className="mt-4 relative z-10">
                <span className={`text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br ${gradientClass} ${glowing ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]' : ''}`}>
                    {value}
                </span>
            </dd>
        </div>
    );
};
