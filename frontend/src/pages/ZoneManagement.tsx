import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Zone {
    id: number;
    name: string;
    description: string;
    createdAt: string;
}

export const ZoneManagement = () => {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentZoneId, setCurrentZoneId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            navigate('/dashboard'); // Restrict access
        } else {
            fetchZones();
        }
    }, [user, navigate]);

    const fetchZones = async () => {
        try {
            setLoading(true);
            const response = await api.get('/zones');
            setZones(response.data.data);
        } catch (error) {
            console.error("Error fetching zones", error);
            alert('Gagal mengambil data zona');
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setIsEditing(false);
        setFormData({ name: '', description: '' });
        setShowModal(true);
    };

    const handleEditClick = (zone: Zone) => {
        setIsEditing(true);
        setCurrentZoneId(zone.id);
        setFormData({ name: zone.name, description: zone.description || '' });
        setShowModal(true);
    };

    const handleDeleteClick = async (id: number) => {
        if (window.confirm('Yakin ingin menghapus zona ini? Note: Menghapus zona akan gagal jika zona ini sudah digunakan oleh data Mustahiq.')) {
            try {
                await api.delete(`/zones/${id}`);
                alert('Zona berhasil dihapus');
                fetchZones();
            } catch (error: any) {
                console.error("Error deleting zone", error);
                alert(error.response?.data?.message || 'Gagal menghapus zona');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditing && currentZoneId) {
                await api.put(`/zones/${currentZoneId}`, formData);
            } else {
                await api.post('/zones', formData);
            }
            setShowModal(false);
            fetchZones();
        } catch (error: any) {
            console.error("Error saving zone", error);
            alert(error.response?.data?.message || 'Gagal menyimpan zona');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Memuat...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Manajemen Zona Penyaluran</h2>
                    <p className="text-sm text-gray-400 mt-1">Kelola zona geografis untuk pembagian zakat</p>
                </div>
                <button
                    onClick={handleAddClick}
                    className="btn-primary"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Tambah Zona
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="glass-table-th">Nama Zona</th>
                            <th className="glass-table-th">Deskripsi</th>
                            <th className="glass-table-th">Tgl Dibuat</th>
                            <th className="glass-table-th text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {zones.map((zone) => (
                            <tr key={zone.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="glass-table-td text-sm font-bold text-white">{zone.name}</td>
                                <td className="glass-table-td text-sm text-gray-400">{zone.description || '-'}</td>
                                <td className="glass-table-td text-sm text-gray-400">
                                    {new Date(zone.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                                <td className="glass-table-td text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-3">
                                        <button
                                            onClick={() => handleEditClick(zone)}
                                            className="text-slate-400 hover:text-slate-300 transition-colors"
                                            title="Edit"
                                        >
                                            <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(zone.id)}
                                            className="text-slate-400 hover:text-slate-300 transition-colors"
                                            title="Hapus"
                                        >
                                            <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {zones.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Belum ada data zona.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Edit/Add Zone */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700/20 blur-2xl rounded-full pointer-events-none"></div>
                        <h3 className="text-xl font-bold mb-6 text-white relative z-10">{isEditing ? 'Edit Zona' : 'Tambah Zona Baru'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                            <div>
                                <label className="glass-label">Nama Zona</label>
                                <input
                                    type="text" required
                                    className="glass-input"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="E.g., RT 01 RW 05"
                                />
                                <p className="text-xs text-slate-400/70 mt-1">E.g., RT 01 RW 05, Blok C, Masjid Al-Hidayah Area</p>
                            </div>
                            <div>
                                <label className="glass-label">Deskripsi (Opsional)</label>
                                <textarea
                                    className="glass-input"
                                    rows={3}
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
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
        </div>
    );
};
