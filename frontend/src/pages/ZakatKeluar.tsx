import { useState, useEffect, useRef } from 'react';
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
    const [formData, setFormData] = useState({ mustahiqId: '', amount: '', category: 'Zakat Mal', distributionMethod: 'Cash', entrustedTo: '' });
    const [proofImage, setProofImage] = useState<File | null>(null);
    const [mustahiqSearch, setMustahiqSearch] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [editFormData, setEditFormData] = useState({ mustahiqId: '', amount: '', category: 'Zakat Mal', distributionMethod: 'Cash', entrustedTo: '' });
    const [editProofImage, setEditProofImage] = useState<File | null>(null);
    const [editMustahiqSearch, setEditMustahiqSearch] = useState('');
    const [editDropdownOpen, setEditDropdownOpen] = useState(false);
    const editDropdownRef = useRef<HTMLDivElement>(null);

    // Toast notification
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const showToast = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const categoryOptions = ['Zakat Mal'];

    // Close add-dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close edit-dropdown on outside click
    useEffect(() => {
        const handleClickOutsideEdit = (e: MouseEvent) => {
            if (editDropdownRef.current && !editDropdownRef.current.contains(e.target as Node)) {
                setEditDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideEdit);
        return () => document.removeEventListener('mousedown', handleClickOutsideEdit);
    }, []);

    const fetchData = async () => {
        try {
            const [trxRes, musRes] = await Promise.all([
                api.get('/zakat-keluar'),
                api.get('/mustahiq')
            ]);
            setTransaksi(trxRes.data);

            // Filter only "Layak" mustahiq for dropdown, sorted alphabetically
            const layakMustahiq = musRes.data
                .filter((m: any) => m.status === 'Layak')
                .sort((a: any, b: any) => a.name.localeCompare(b.name, 'id'));
            setMustahiqOptions(layakMustahiq);
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
            setFormData({ mustahiqId: mustahiqOptions[0]?.id || '', amount: '', category: 'Zakat Mal', distributionMethod: 'Cash', entrustedTo: '' });
            setProofImage(null);
            fetchData();
        } catch (error) {
            alert('Gagal menambahkan penyaluran zakat');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenEdit = (record: any) => {
        setEditingRecord(record);
        setEditFormData({
            mustahiqId: record.mustahiqId,
            amount: record.amount.toString(),
            category: record.category,
            distributionMethod: record.distributionMethod,
            entrustedTo: record.entrustedTo || '',
        });
        setEditProofImage(null);
        setEditMustahiqSearch('');
        setEditDropdownOpen(false);
        setShowEditModal(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRecord) return;
        setSubmitting(true);
        try {
            const submitData = new FormData();
            submitData.append('mustahiqId', editFormData.mustahiqId);
            submitData.append('amount', editFormData.amount);
            submitData.append('category', editFormData.category);
            submitData.append('distributionMethod', editFormData.distributionMethod);
            if (editFormData.distributionMethod === 'Titip') {
                submitData.append('entrustedTo', editFormData.entrustedTo);
            }
            if (editProofImage) {
                submitData.append('proofImage', editProofImage);
            }
            await api.put(`/zakat-keluar/${editingRecord.id}`, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setShowEditModal(false);
            setEditingRecord(null);
            fetchData();
            showToast('Data penyaluran zakat berhasil diperbarui!');
        } catch (error) {
            alert('Gagal memperbarui penyaluran zakat');
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
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleOpenEdit(t)}
                                                        className="text-slate-400 hover:text-slate-200 transition-colors"
                                                        title="Edit Transaksi"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(t.id)}
                                                        className="text-red-400 hover:text-red-300 transition-colors"
                                                        title="Hapus Transaksi"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
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
                                <div className="relative" ref={dropdownRef}>
                                    {/* Trigger button */}
                                    <button
                                        type="button"
                                        onClick={() => setDropdownOpen(prev => !prev)}
                                        className="glass-input text-left flex items-center justify-between w-full"
                                    >
                                        <span className={formData.mustahiqId ? 'text-white' : 'text-slate-500'}>
                                            {formData.mustahiqId
                                                ? (() => { const m = mustahiqOptions.find((m: any) => m.id === formData.mustahiqId); return m ? `${m.name} (${m.asnafCategory})` : 'Pilih Mustahiq'; })()
                                                : 'Pilih Mustahiq'}
                                        </span>
                                        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Dropdown panel */}
                                    {dropdownOpen && (
                                        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
                                            {/* Search input */}
                                            <div className="p-2 border-b border-slate-700">
                                                <div className="relative">
                                                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        placeholder="Cari mustahiq..."
                                                        value={mustahiqSearch}
                                                        onChange={e => setMustahiqSearch(e.target.value)}
                                                        className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                                                    />
                                                </div>
                                            </div>
                                            {/* Options list */}
                                            <ul className="max-h-48 overflow-y-auto py-1">
                                                {mustahiqOptions
                                                    .filter((m: any) => m.name.toLowerCase().includes(mustahiqSearch.toLowerCase()))
                                                    .map((m: any) => (
                                                        <li
                                                            key={m.id}
                                                            onClick={() => {
                                                                setFormData({ ...formData, mustahiqId: m.id });
                                                                setDropdownOpen(false);
                                                                setMustahiqSearch('');
                                                            }}
                                                            className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                                                                formData.mustahiqId === m.id
                                                                    ? 'bg-slate-700 text-white'
                                                                    : 'text-slate-300 hover:bg-slate-800'
                                                            }`}
                                                        >
                                                            <span>{m.name}</span>
                                                            <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{m.asnafCategory}</span>
                                                        </li>
                                                    ))
                                                }
                                                {mustahiqOptions.filter((m: any) => m.name.toLowerCase().includes(mustahiqSearch.toLowerCase())).length === 0 && (
                                                    <li className="px-3 py-3 text-sm text-slate-500 text-center">Tidak ditemukan</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
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
            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700/20 blur-2xl rounded-full pointer-events-none"></div>
                        <h3 className="text-xl font-bold mb-6 text-white relative z-10">Edit Penyaluran Zakat</h3>
                        <form onSubmit={handleUpdate} className="space-y-4 relative z-10">
                            <div>
                                <label className="glass-label">Penerima (Mustahiq)</label>
                                <div className="relative" ref={editDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setEditDropdownOpen(prev => !prev)}
                                        className="glass-input text-left flex items-center justify-between w-full"
                                    >
                                        <span className={editFormData.mustahiqId ? 'text-white' : 'text-slate-500'}>
                                            {editFormData.mustahiqId
                                                ? (() => { const m = mustahiqOptions.find((m: any) => m.id === editFormData.mustahiqId); return m ? `${m.name} (${m.asnafCategory})` : 'Pilih Mustahiq'; })()
                                                : 'Pilih Mustahiq'}
                                        </span>
                                        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${editDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {editDropdownOpen && (
                                        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
                                            <div className="p-2 border-b border-slate-700">
                                                <div className="relative">
                                                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        placeholder="Cari mustahiq..."
                                                        value={editMustahiqSearch}
                                                        onChange={e => setEditMustahiqSearch(e.target.value)}
                                                        className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                                                    />
                                                </div>
                                            </div>
                                            <ul className="max-h-48 overflow-y-auto py-1">
                                                {mustahiqOptions
                                                    .filter((m: any) => m.name.toLowerCase().includes(editMustahiqSearch.toLowerCase()))
                                                    .map((m: any) => (
                                                        <li
                                                            key={m.id}
                                                            onClick={() => {
                                                                setEditFormData({ ...editFormData, mustahiqId: m.id });
                                                                setEditDropdownOpen(false);
                                                                setEditMustahiqSearch('');
                                                            }}
                                                            className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                                                                editFormData.mustahiqId === m.id
                                                                    ? 'bg-slate-700 text-white'
                                                                    : 'text-slate-300 hover:bg-slate-800'
                                                            }`}
                                                        >
                                                            <span>{m.name}</span>
                                                            <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{m.asnafCategory}</span>
                                                        </li>
                                                    ))
                                                }
                                                {mustahiqOptions.filter((m: any) => m.name.toLowerCase().includes(editMustahiqSearch.toLowerCase())).length === 0 && (
                                                    <li className="px-3 py-3 text-sm text-slate-500 text-center">Tidak ditemukan</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="glass-label">Kategori Zakat</label>
                                <select
                                    className="glass-input"
                                    value={editFormData.category}
                                    onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                                >
                                    {['Zakat Mal'].map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="glass-label">Jumlah (Rp)</label>
                                <input
                                    type="number" required min="1000"
                                    className="glass-input mb-1"
                                    value={editFormData.amount}
                                    onChange={e => setEditFormData({ ...editFormData, amount: e.target.value })}
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {[50000, 100000, 200000, 500000, 1000000, 2000000].map(amount => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => setEditFormData({ ...editFormData, amount: amount.toString() })}
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
                                        value={editFormData.distributionMethod}
                                        onChange={e => setEditFormData({ ...editFormData, distributionMethod: e.target.value })}
                                    >
                                        <option value="Cash" className="bg-slate-900">Cash</option>
                                        <option value="Transfer" className="bg-slate-900">Transfer</option>
                                        <option value="Titip" className="bg-slate-900">Titip</option>
                                    </select>
                                </div>
                                {editFormData.distributionMethod === 'Titip' && (
                                    <div>
                                        <label className="glass-label">Dititipkan Kepada</label>
                                        <input
                                            type="text" required
                                            placeholder="Nama Penerima"
                                            className="glass-input"
                                            value={editFormData.entrustedTo}
                                            onChange={e => setEditFormData({ ...editFormData, entrustedTo: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="glass-label">Ganti Bukti Transfer (Opsional)</label>
                                {editingRecord?.proofImageUrl && !editProofImage && (
                                    <p className="text-xs text-slate-400 mt-1 mb-1">Bukti saat ini tersimpan. Upload baru untuk mengganti.</p>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="mt-1 block w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-white/10 file:text-slate-300 hover:file:bg-white/20"
                                    onChange={e => { if (e.target.files?.[0]) setEditProofImage(e.target.files[0]); }}
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingRecord(null); }}
                                    className="btn-secondary"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit" disabled={submitting || !editFormData.mustahiqId}
                                    className="btn-primary disabled:opacity-50"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Image preview modal */}
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

            {/* Success toast */}
            {successMessage && (
                <div className="fixed top-6 right-6 z-[70] flex items-center gap-3 bg-slate-800 border border-slate-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-pulse">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {successMessage}
                </div>
            )}
        </>
    );
};
