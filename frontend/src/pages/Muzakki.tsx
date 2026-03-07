import { useState, useEffect } from 'react';
import api from '../utils/api';

export const MuzakkiList = () => {
    const [muzakki, setMuzakki] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchMuzakki = async () => {
        try {
            const response = await api.get('/muzakki');
            setMuzakki(response.data);
        } catch (error) {
            console.error("Error fetching muzakki", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMuzakki();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/muzakki', formData);
            setShowModal(false);
            setFormData({ name: '', phone: '', address: '' });
            fetchMuzakki();
        } catch (error) {
            alert('Gagal menambahkan data Muzakki');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Memuat...</div>;

    return (
        <>
            <div className="glass-card p-6 relative mb-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/20 blur-3xl rounded-full pointer-events-none"></div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Data Muzakki</h2>
                        <p className="text-sm text-gray-400 mt-1">Daftar donatur dan penderma</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary w-full sm:w-auto flex items-center justify-center p-0 px-5"
                        style={{ height: '42px' }}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Tambah Muzakki
                    </button>
                </div>

                <div className="overflow-x-auto relative z-10">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="glass-table-th">Nama</th>
                                <th className="glass-table-th">No HP</th>
                                <th className="glass-table-th">Alamat</th>
                                <th className="glass-table-th">Bergabung Pada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {muzakki.map((m) => (
                                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="glass-table-td text-sm font-bold text-white">{m.name}</td>
                                    <td className="glass-table-td text-sm text-gray-300">{m.phone}</td>
                                    <td className="glass-table-td text-sm text-gray-400">{m.address}</td>
                                    <td className="glass-table-td text-sm text-gray-400">
                                        {new Date(m.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                </tr>
                            ))}
                            {muzakki.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Belum ada data Muzakki.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700/20 blur-2xl rounded-full pointer-events-none"></div>
                        <h3 className="text-xl font-bold mb-6 text-white relative z-10">Tambah Muzakki Baru</h3>
                        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                            <div>
                                <label className="glass-label">Nama Lengkap</label>
                                <input
                                    type="text" required
                                    className="glass-input"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="glass-label">Nomor HP</label>
                                <input
                                    type="tel" required
                                    className="glass-input"
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="glass-label">Alamat</label>
                                <textarea
                                    required rows={3}
                                    className="glass-input"
                                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
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
                                    type="submit" disabled={submitting}
                                    className="btn-primary disabled:opacity-50"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
