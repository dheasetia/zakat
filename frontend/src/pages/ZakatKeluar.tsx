import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export const ZakatKeluarList = () => {
    const { user } = useAuth();
    const [transaksi, setTransaksi] = useState<any[]>([]);
    const [mustahiqOptions, setMustahiqOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ mustahiqId: '', amount: '', category: 'Zakat Fitrah', distributionMethod: 'Cash', entrustedTo: '' });
    const [proofImage, setProofImage] = useState<File | null>(null);

    const categoryOptions = ['Zakat Fitrah', 'Zakat Mal', 'Infaq', 'Sedekah'];

    const fetchData = async () => {
        try {
            const [trxRes, musRes] = await Promise.all([
                api.get('/zakat-keluar'),
                api.get('/mustahiq')
            ]);
            setTransaksi(trxRes.data);

            // Filter only "Layak" mustahiq for dropdown
            const layakMustahiq = musRes.data.filter((m: any) => m.status === 'Layak');
            setMustahiqOptions(layakMustahiq);

            if (layakMustahiq.length > 0) {
                setFormData(prev => ({ ...prev, mustahiqId: layakMustahiq[0].id }));
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
            const submitData = new FormData();
            submitData.append('mustahiqId', formData.mustahiqId);
            submitData.append('amount', formData.amount);
            submitData.append('category', formData.category);
            submitData.append('distributionMethod', formData.distributionMethod);
            if (formData.distributionMethod === 'Titip') {
                submitData.append('entrustedTo', formData.entrustedTo);
            }

            if (proofImage) {
                submitData.append('proofImage', proofImage);
            }

            await api.post('/zakat-keluar', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setShowModal(false);
            setFormData({ mustahiqId: mustahiqOptions[0]?.id || '', amount: '', category: 'Zakat Fitrah', distributionMethod: 'Cash', entrustedTo: '' });
            setProofImage(null);
            fetchData();
        } catch (error) {
            alert('Gagal menambahkan penyaluran zakat');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Yakin ingin menghapus transaksi penyaluran zakat ini?')) {
            try {
                await api.delete(`/zakat-keluar/${id}`);
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
                        <h2 className="text-2xl font-bold text-white">Data Penyaluran Zakat (Keluar)</h2>
                        <p className="text-sm text-gray-400 mt-1">Riwayat distribusi zakat kepada Mustahiq</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary w-full sm:w-auto flex items-center justify-center p-0 px-5"
                        style={{ height: '42px' }}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Tambah Penyaluran
                    </button>
                </div>

                <div className="overflow-x-auto relative z-10">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="glass-table-th">Tanggal</th>
                                <th className="glass-table-th">Penerima (Mustahiq)</th>
                                <th className="glass-table-th">Kategori</th>
                                <th className="glass-table-th">Jumlah</th>
                                <th className="glass-table-th">Metode</th>
                                <th className="glass-table-th">Petugas</th>
                                <th className="glass-table-th text-center">Bukti Transfer</th>
                                {user?.role === 'ADMIN' && <th className="glass-table-th text-right">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transaksi.map((t) => {
                                // find name in options, but if mustahiq is not 'Layak' anymore, need to fetch from backend or just show ID. 
                                // for simplicity, showing id if name not found in options.
                                const mustahiqName = mustahiqOptions.find(m => m.id === t.mustahiqId)?.name || t.mustahiqId;
                                return (
                                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="glass-table-td text-sm text-gray-300">
                                            {new Date(t.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="glass-table-td text-sm font-bold text-white">{mustahiqName}</td>
                                        <td className="glass-table-td">
                                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="glass-table-td text-sm font-bold text-slate-200">
                                            {formatCurrency(t.amount)}
                                        </td>
                                        <td className="glass-table-td">
                                            <div className="text-sm font-medium text-gray-200">{t.distributionMethod}</div>
                                            {t.distributionMethod === 'Titip' && t.entrustedTo && (
                                                <div className="text-xs text-slate-400/70 mt-0.5">via: {t.entrustedTo}</div>
                                            )}
                                        </td>
                                        <td className="glass-table-td text-sm text-gray-400">
                                            {t.distributedByName || '-'}
                                        </td>
                                        <td className="glass-table-td text-sm text-center">
                                            {t.proofImageUrl ? (
                                                <button
                                                    onClick={() => setPreviewImageUrl(`http://localhost:3000${t.proofImageUrl}`)}
                                                    className="text-slate-400 hover:text-slate-300 hover:underline transition-colors flex items-center justify-center mx-auto"
                                                    title="Lihat Bukti"
                                                >
                                                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    Lihat
                                                </button>
                                            ) : (
                                                <span className="text-gray-500 italic text-xs">Tidak ada</span>
                                            )}
                                        </td>
                                        {user?.role === 'ADMIN' && (
                                            <td className="glass-table-td text-right text-sm">
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
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Belum ada data penyaluran zakat.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700/20 blur-2xl rounded-full pointer-events-none"></div>
                        <h3 className="text-xl font-bold mb-6 text-white relative z-10">Catat Penyaluran Zakat</h3>
                        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                            <div>
                                <label className="glass-label">Penerima (Mustahiq)</label>
                                <select
                                    required
                                    className="glass-input"
                                    value={formData.mustahiqId} onChange={e => setFormData({ ...formData, mustahiqId: e.target.value })}
                                >
                                    <option value="" disabled className="bg-slate-900">Pilih Mustahiq</option>
                                    {mustahiqOptions.map(m => <option key={m.id} value={m.id} className="bg-slate-900">{m.name} ({m.asnafCategory})</option>)}
                                </select>
                                {mustahiqOptions.length === 0 && (
                                    <p className="text-xs text-red-400 mt-1">Tidak ada Mustahiq dengan status 'Layak'.</p>
                                )}
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
                                    className="glass-input mb-1"
                                    value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {[50000, 100000, 200000, 500000, 1000000, 2000000].map(amount => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                                            className="px-2 py-1 text-xs font-semibold rounded-md bg-white/5 border border-white/10 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                                        >
                                            {new Intl.NumberFormat('id-ID').format(amount)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="glass-label">Metode Penyaluran</label>
                                    <select
                                        className="glass-input"
                                        value={formData.distributionMethod} onChange={e => setFormData({ ...formData, distributionMethod: e.target.value })}
                                    >
                                        <option value="Cash" className="bg-slate-900">Cash</option>
                                        <option value="Transfer" className="bg-slate-900">Transfer</option>
                                        <option value="Titip" className="bg-slate-900">Titip</option>
                                    </select>
                                </div>
                                {formData.distributionMethod === 'Titip' && (
                                    <div>
                                        <label className="glass-label">Dititipkan Kepada</label>
                                        <input
                                            type="text" required
                                            placeholder="Nama Penerima"
                                            className="glass-input"
                                            value={formData.entrustedTo} onChange={e => setFormData({ ...formData, entrustedTo: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="glass-label">Bukti Transfer (Opsional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="mt-1 block w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-white/10 file:text-slate-300 hover:file:bg-white/20"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setProofImage(e.target.files[0]);
                                        }
                                    }}
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
                                    type="submit" disabled={submitting || !formData.mustahiqId}
                                    className="btn-primary disabled:opacity-50"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Penyaluran'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {previewImageUrl && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setPreviewImageUrl(null)}>
                    <div className="relative max-w-4xl w-full flex justify-center">
                        <button
                            className="absolute -top-12 right-0 text-white hover:text-slate-300 font-bold text-xl transition-colors"
                            onClick={() => setPreviewImageUrl(null)}
                        >
                            Tutup (X)
                        </button>
                        <img src={previewImageUrl || undefined} alt="Preview" className="max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()} />
                    </div>
                </div>
            )}
        </>
    );
};
