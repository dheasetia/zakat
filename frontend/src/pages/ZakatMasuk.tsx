import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export const ZakatMasukList = () => {
    const { user } = useAuth();
    const [transaksi, setTransaksi] = useState<any[]>([]);
    const [muzakkiOptions, setMuzakkiOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ muzakkiId: '', amount: '', category: 'Zakat Fitrah' });

    const categoryOptions = ['Zakat Fitrah', 'Zakat Mal', 'Infaq', 'Sedekah'];

    const fetchData = async () => {
        try {
            const [trxRes, muzRes] = await Promise.all([
                api.get('/zakat-masuk'),
                api.get('/muzakki')
            ]);
            setTransaksi(trxRes.data);
            setMuzakkiOptions(muzRes.data);
            if (muzRes.data.length > 0) {
                setFormData(prev => ({ ...prev, muzakkiId: muzRes.data[0].id }));
            }
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/zakat-masuk', {
                ...formData,
                amount: parseFloat(formData.amount)
            });
            setShowModal(false);
            setFormData({ muzakkiId: muzakkiOptions[0]?.id || '', amount: '', category: 'Zakat Fitrah' });
            fetchData();
        } catch (error) {
            alert('Gagal menambahkan transaksi');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Yakin ingin menghapus transaksi penerimaan zakat ini?')) {
            try {
                await api.delete(`/zakat-masuk/${id}`);
                alert('Transaksi berhasil dihapus');
                fetchData();
            } catch (error: any) {
                console.error("Error deleting transaksi", error);
                alert(error.response?.data?.message || 'Gagal menghapus transaksi');
            }
        }
    };

    if (loading) return <div>Memuat...</div>;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    return (
        <>
            <div className="glass-card p-6 relative mb-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/20 blur-3xl rounded-full pointer-events-none"></div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Data Zakat Masuk</h2>
                        <p className="text-sm text-gray-400 mt-1">Penerimaan dana zakat dari Muzakki</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary w-full sm:w-auto flex items-center justify-center p-0 px-5"
                        style={{ height: '42px' }}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Tambah Transaksi
                    </button>
                </div>

                <div className="overflow-x-auto relative z-10">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="glass-table-th">Tanggal</th>
                                <th className="glass-table-th">Muzakki</th>
                                <th className="glass-table-th">Kategori</th>
                                <th className="glass-table-th">Jumlah</th>
                                {user?.role === 'ADMIN' && <th className="glass-table-th text-right">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transaksi.map((t) => {
                                const muzakkiName = muzakkiOptions.find(m => m.id === t.muzakkiId)?.name || t.muzakkiId;
                                return (
                                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="glass-table-td text-sm text-gray-300">
                                            {new Date(t.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="glass-table-td text-sm font-bold text-white">{muzakkiName}</td>
                                        <td className="glass-table-td">
                                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="glass-table-td text-sm font-bold text-slate-200">
                                            {formatCurrency(t.amount)}
                                        </td>
                                        {user?.role === 'ADMIN' && (
                                            <td className="glass-table-td text-right">
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                    title="Hapus Transaksi"
                                                >
                                                    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            {transaksi.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Belum ada data zakat masuk.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700/20 blur-2xl rounded-full pointer-events-none"></div>
                        <h3 className="text-xl font-bold mb-6 text-white relative z-10">Catat Zakat Masuk</h3>
                        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                            <div>
                                <label className="glass-label">Muzakki (Donatur)</label>
                                <select
                                    required
                                    className="glass-input"
                                    value={formData.muzakkiId} onChange={e => setFormData({ ...formData, muzakkiId: e.target.value })}
                                >
                                    <option value="" disabled className="bg-slate-900">Pilih Muzakki</option>
                                    {muzakkiOptions.map(m => <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="glass-label">Kategori Zakat</label>
                                <select
                                    className="glass-input"
                                    value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categoryOptions.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="glass-label">Jumlah (Rp)</label>
                                <input
                                    type="number" required min="1000"
                                    className="glass-input"
                                    value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-white/10">
                                <button
                                    type="button" onClick={() => setShowModal(false)}
                                    className="btn-secondary"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit" disabled={submitting || !formData.muzakkiId}
                                    className="btn-primary disabled:opacity-50"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
