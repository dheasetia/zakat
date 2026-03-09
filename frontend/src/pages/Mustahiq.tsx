import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export const MustahiqList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [mustahiq, setMustahiq] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [submitting, setSubmitting] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '', nik: '', phone: '', address: '', asnafCategory: 'Fakir',
        gender: 'Laki-laki', age: '', priorityLevel: '1', zoneId: ''
    });
    const [idCardImage, setIdCardImage] = useState<File | null>(null);
    const [profileImage, setProfileImage] = useState<File | null>(null);

    const asnafOptions = ['Fakir', 'Miskin', 'Amil', 'Mualaf', 'Riqab', 'Gharim', 'Fisabilillah', 'Ibnu Sabil'];

    const fetchMustahiqAndZones = async () => {
        try {
            const [mustahiqRes, zonesRes] = await Promise.all([
                api.get('/mustahiq'),
                api.get('/zones')
            ]);
            setMustahiq(mustahiqRes.data);
            setZones(zonesRes.data.data);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMustahiqAndZones();
    }, []);

    const handleUpdateStatus = async (e: React.MouseEvent, id: string, currentStatus: string) => {
        e.stopPropagation();
        const newStatus = currentStatus === 'Layak' ? 'Tidak Layak' : 'Layak';
        try {
            await api.patch(`/mustahiq/${id}/status`, { status: newStatus });
            fetchMustahiqAndZones();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const submitData = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                submitData.append(key, value);
            });
            if (idCardImage) submitData.append('idCardImage', idCardImage);
            if (profileImage) submitData.append('profileImage', profileImage);

            if (editingId) {
                await api.put(`/mustahiq/${editingId}`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/mustahiq', submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setEditingId(null);
            setFormData({ name: '', nik: '', phone: '', address: '', asnafCategory: 'Fakir', gender: 'Laki-laki', age: '', priorityLevel: '1', zoneId: '' });
            setIdCardImage(null);
            setProfileImage(null);
            fetchMustahiqAndZones();
            setTimeout(() => nameInputRef.current?.focus(), 50);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Gagal menyimpan data Mustahiq';
            alert(errorMsg);
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (e: React.MouseEvent, m: any) => {
        e.stopPropagation();
        setEditingId(m.id);
        setFormData({
            name: m.name, nik: m.nik, phone: m.phone || '', address: m.address || '',
            asnafCategory: m.asnafCategory,
            gender: m.gender || 'Laki-laki', age: m.age ? m.age.toString() : '',
            priorityLevel: m.priorityLevel ? m.priorityLevel.toString() : '1',
            zoneId: m.zoneId ? m.zoneId.toString() : ''
        });
        setIdCardImage(null);
        setProfileImage(null);
        setTimeout(() => {
            nameInputRef.current?.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Yakin ingin menghapus data Mustahiq ini?')) {
            try {
                await api.delete(`/mustahiq/${id}`);
                fetchMustahiqAndZones();
            } catch (error) {
                alert('Gagal menghapus data. Pastikan tidak ada data penyaluran zakat yang terkait.');
            }
        }
    };

    if (loading) return <div>Memuat...</div>;

    return (
        <>
            {(user?.role === 'ADMIN' || user?.role === 'PEMBAGI') && (
                <div className="glass-card p-6 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700/20 blur-2xl rounded-full"></div>
                    <h3 className="text-xl font-bold mb-6 text-white relative z-10">{editingId ? 'Edit Data Mustahiq' : 'Tambah Mustahiq Baru'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                        <div>
                            <label className="glass-label">Nama Lengkap</label>
                            <input
                                type="text" required autoFocus
                                ref={nameInputRef}
                                className="glass-input"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="glass-label">Zona Penyaluran (Opsional)</label>
                            <select
                                className="glass-input"
                                value={formData.zoneId} onChange={e => setFormData({ ...formData, zoneId: e.target.value })}
                            >
                                <option value="" className="bg-slate-900">-- Pilih Zona --</option>
                                {zones.map((zone) => (
                                    <option key={zone.id} value={zone.id} className="bg-slate-900">{zone.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="glass-label">NIK / Identitas</label>
                                <input
                                    type="text" required
                                    className="glass-input"
                                    value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="glass-label">Nomor HP (Opsional)</label>
                                <input
                                    type="tel"
                                    className="glass-input"
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="glass-label">Kategori Asnaf</label>
                                <select
                                    className="glass-input"
                                    value={formData.asnafCategory} onChange={e => setFormData({ ...formData, asnafCategory: e.target.value })}
                                >
                                    {asnafOptions.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="glass-label">Tingkat Prioritas</label>
                                <select
                                    className="glass-input"
                                    value={formData.priorityLevel} onChange={e => setFormData({ ...formData, priorityLevel: e.target.value })}
                                >
                                    <option value="1" className="bg-slate-900">1 - Paling Rendah (Biasa)</option>
                                    <option value="2" className="bg-slate-900">2 - Rendah</option>
                                    <option value="3" className="bg-slate-900">3 - Menengah (Sedang)</option>
                                    <option value="4" className="bg-slate-900">4 - Tinggi</option>
                                    <option value="5" className="bg-slate-900">5 - Paling Tinggi (Sangat Darurat)</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="glass-label">Jenis Kelamin</label>
                                <select
                                    className="glass-input"
                                    value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="Laki-laki" className="bg-slate-900">Laki-laki</option>
                                    <option value="Perempuan" className="bg-slate-900">Perempuan</option>
                                </select>
                            </div>
                            <div>
                                <label className="glass-label">Umur (Opsional)</label>
                                <input
                                    type="number" min="0" max="150"
                                    className="glass-input"
                                    value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="glass-label">Foto KTP (Opsional)</label>
                                <input
                                    type="file" accept="image/*"
                                    className="mt-1 block w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-white/10 file:text-slate-300 hover:file:bg-white/20"
                                    onChange={e => setIdCardImage(e.target.files ? e.target.files[0] : null)}
                                />
                            </div>
                            <div>
                                <label className="glass-label">Foto Wajah (Opsional)</label>
                                <input
                                    type="file" accept="image/*"
                                    className="mt-1 block w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-white/10 file:text-slate-300 hover:file:bg-white/20"
                                    onChange={e => setProfileImage(e.target.files ? e.target.files[0] : null)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="glass-label">Alamat Lengkap</label>
                            <textarea
                                rows={2}
                                className="glass-input"
                                value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({ name: '', nik: '', phone: '', address: '', asnafCategory: 'Fakir', gender: 'Laki-laki', age: '', priorityLevel: '1', zoneId: '' });
                                        setIdCardImage(null);
                                        setProfileImage(null);
                                        setTimeout(() => nameInputRef.current?.focus(), 50);
                                    }}
                                    className="btn-secondary"
                                >
                                    Batal Edit
                                </button>
                            )}
                            <button
                                type="submit" disabled={submitting}
                                className="btn-primary disabled:opacity-50"
                            >
                                {submitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Simpan Mustahiq (Enter)')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-card p-6 relative mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Data Mustahiq</h2>
                        <p className="text-sm text-gray-400 mt-1">Kelola data penerima zakat terdaftar</p>
                    </div>
                    {(user?.role === 'ADMIN' || user?.role === 'PEMBAGI') && (
                        <button
                            onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                setTimeout(() => nameInputRef.current?.focus(), 50);
                            }}
                            className="btn-primary w-full sm:w-auto flex items-center justify-center p-0 px-5"
                            style={{ height: '42px' }}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            Ke Form Input
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="glass-table-th">Foto</th>
                                <th className="glass-table-th">Nama</th>
                                <th className="glass-table-th">Identitas</th>
                                <th className="glass-table-th">Zona</th>
                                <th className="glass-table-th">Kategori & Prioritas</th>
                                <th className="glass-table-th">Petugas Pendata</th>
                                <th className="glass-table-th">Penerimaan</th>
                                <th className="glass-table-th">Status</th>
                                {(user?.role === 'ADMIN' || user?.role === 'PEMBAGI') && (
                                    <th className="glass-table-th">Aksi</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {mustahiq.map((m) => (
                                <tr
                                    key={m.id}
                                    onClick={() => navigate(`/mustahiq/${m.id}`)}
                                    className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="glass-table-td">
                                        <div className="h-10 w-10 flex-shrink-0">
                                            {m.profileImageUrl ? (
                                                <img className="h-10 w-10 rounded-full object-cover border border-white/20" src={`http://localhost:3000${m.profileImageUrl}`} alt="" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-gray-500 border border-white/10">
                                                    <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="glass-table-td">
                                        <div className="font-semibold text-white">{m.name}</div>
                                        <div className="text-sm text-gray-400">{m.gender || '-'} {m.age ? `• ${m.age} Thn` : ''}</div>
                                    </td>
                                    <td className="glass-table-td">
                                        <div className="text-sm text-gray-300">{m.nik}</div>
                                        <div className="text-sm text-gray-400 mb-1">{m.phone}</div>
                                        {m.idCardImageUrl && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(`http://localhost:3000${m.idCardImageUrl}`); }}
                                                className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                                            >
                                                Lihat KTP
                                            </button>
                                        )}
                                    </td>
                                    <td className="glass-table-td">
                                        <div className="text-sm text-gray-300">{m.zoneName || '-'}</div>
                                    </td>
                                    <td className="glass-table-td">
                                        <div className="text-sm font-medium text-slate-300">{m.asnafCategory}</div>
                                        <div className="text-sm text-gray-400 flex items-center mt-1">
                                            Prt: <span className="ml-1 text-gray-300 font-semibold">{m.priorityLevel || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="glass-table-td text-sm text-gray-400">{m.inputByName || '-'}</td>
                                    <td className="glass-table-td">
                                        <div className="text-sm font-bold text-emerald-400">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(m.totalReceived) || 0)}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {Number(m.receiveCount) || 0} kali menerima
                                        </div>
                                    </td>
                                    <td className="glass-table-td">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border
                    ${m.status === 'Layak' ? 'bg-slate-800 text-slate-300 border-slate-700' :
                                                m.status === 'Tidak Layak' ? 'bg-slate-800/80 text-slate-400 border-slate-700/80' :
                                                    'bg-slate-800/50 text-slate-300 border-slate-700/50'}`}>
                                            {m.status}
                                        </span>
                                    </td>
                                    {(user?.role === 'ADMIN' || user?.role === 'PEMBAGI') && (
                                        <td className="glass-table-td text-sm font-medium">
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={(e) => handleEdit(e, m)}
                                                    className="text-slate-400 hover:text-slate-300 transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, m.id)}
                                                    className="text-slate-400 hover:text-slate-300 transition-colors"
                                                    title="Hapus"
                                                >
                                                    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                                {(user?.role === 'ADMIN') && (
                                                    <button
                                                        onClick={(e) => handleUpdateStatus(e, m.id, m.status)}
                                                        className="text-slate-400 hover:text-slate-300 ml-2 border-l border-white/10 pl-3 transition-colors text-xs uppercase tracking-wider font-bold"
                                                    >
                                                        Ubah Status
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {mustahiq.length === 0 && (
                                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Belum ada data Mustahiq.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal removed as form is now inline */}
            {
                previewImageUrl && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" onClick={() => setPreviewImageUrl(null)}>
                        <div className="relative max-w-4xl w-full flex justify-center">
                            <button
                                className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold text-xl"
                                onClick={() => setPreviewImageUrl(null)}
                            >
                                Tutup (X)
                            </button>
                            <img src={previewImageUrl || undefined} alt="Preview" className="max-h-[85vh] object-contain rounded shadow-lg bg-white" onClick={(e) => e.stopPropagation()} />
                        </div>
                    </div>
                )
            }
        </>
    );
};
