import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export const MustahiqDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Core Data States
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Edit Modal States
    const [showModal, setShowModal] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '', nik: '', phone: '', address: '', asnafCategory: 'Fakir',
        gender: 'Laki-laki', age: '', priorityLevel: '1', zoneId: ''
    });
    const [zones, setZones] = useState<any[]>([]);
    const [idCardImage, setIdCardImage] = useState<File | null>(null);
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const asnafOptions = ['Fakir', 'Miskin', 'Amil', 'Mualaf', 'Riqab', 'Gharim', 'Fisabilillah', 'Ibnu Sabil'];

    const fetchDetail = useCallback(async () => {
        try {
            const [mustahiqRes, zonesRes] = await Promise.all([
                api.get(`/mustahiq/${id}`),
                api.get('/zones')
            ]);
            setData(mustahiqRes.data);
            setZones(zonesRes.data.data);
        } catch (error) {
            console.error("Error fetching mustahiq detail", error);
            alert('Gagal memuat detail Mustahiq');
            navigate('/mustahiq');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);


    const handleEditClick = () => {
        if (!data?.mustahiq) return;
        const mustahiq = data.mustahiq;
        setFormData({
            name: mustahiq.name, nik: mustahiq.nik, phone: mustahiq.phone || '', address: mustahiq.address || '',
            asnafCategory: mustahiq.asnafCategory,
            gender: mustahiq.gender || 'Laki-laki', age: mustahiq.age ? mustahiq.age.toString() : '',
            priorityLevel: mustahiq.priorityLevel ? mustahiq.priorityLevel.toString() : '1',
            zoneId: mustahiq.zoneId ? mustahiq.zoneId.toString() : ''
        });
        setIdCardImage(null);
        setProfileImage(null);
        setShowModal(true);
    };


    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const submitData = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                submitData.append(key, value);
            });
            if (idCardImage) submitData.append('idCardImage', idCardImage);
            if (profileImage) submitData.append('profileImage', profileImage);

            await api.put(`/mustahiq/${data.mustahiq.id}`, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setShowModal(false);
            fetchDetail(); // Refresh data after update
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Gagal menyimpan data Mustahiq';
            alert(errorMsg);
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    if (loading) return <div>Memuat...</div>;
    if (!data) return <div>Data tidak ditemukan</div>;

    const { mustahiq, history } = data;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <button
                    onClick={() => navigate('/mustahiq')}
                    className="text-gray-400 hover:text-white font-medium flex items-center transition-colors"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Kembali
                </button>
                <h2 className="text-2xl font-bold flex-1 text-white">Detail Mustahiq</h2>
                {(user?.role === 'ADMIN' || user?.role === 'PEMBAGI') && (
                    <button
                        onClick={handleEditClick}
                        className="btn-primary flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit Data Mustahiq
                    </button>
                )}
            </div>

            {/* Profile Section */}
            <div className="glass-card p-6 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/20 blur-3xl rounded-full pointer-events-none"></div>
                <div className="flex flex-col md:flex-row gap-6 sm:p-8 relative z-10">
                    <div className="flex-shrink-0">
                        {mustahiq.profileImageUrl ? (
                            <img className="h-32 w-32 rounded-full object-cover shadow-2xl border-4 border-white/10" src={`http://localhost:3000${mustahiq.profileImageUrl}`} alt={mustahiq.name} />
                        ) : (
                            <div className="h-32 w-32 rounded-full bg-white/10 flex items-center justify-center text-gray-500 shadow-2xl border-4 border-white/10">
                                <svg className="h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        )}
                    </div >

                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                        <div>
                            <p className="text-sm text-gray-400 font-medium mb-1">Nama Lengkap</p>
                            <p className="text-xl font-bold text-white">{mustahiq.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-medium mb-1">Kategori Asnaf</p>
                            <p className="text-lg font-bold text-slate-200">{mustahiq.asnafCategory}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-medium mb-1">NIK</p>
                            <p className="text-gray-200">{mustahiq.nik}</p>
                            {mustahiq.idCardImageUrl && (
                                <button
                                    onClick={() => setPreviewImageUrl(`http://localhost:3000${mustahiq.idCardImageUrl}`)}
                                    className="text-xs text-slate-400 hover:text-slate-300 hover:underline mt-1"
                                >
                                    (Lihat Foto KTP)
                                </button>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-medium mb-1">Zona Penyaluran</p>
                            <p className="text-gray-200">{mustahiq.zoneName || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-medium mb-1">Nomor HP</p>
                            <p className="text-gray-200">{mustahiq.phone || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-medium mb-1">Jenis Kelamin & Umur</p>
                            <p className="text-gray-200">{mustahiq.gender || '-'} {mustahiq.age ? ` (${mustahiq.age} Thn)` : ''}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-medium mb-1">Tingkat Prioritas</p>
                            <p className="text-xl font-bold text-slate-200">{mustahiq.priorityLevel ? `${mustahiq.priorityLevel} / 5` : '-'}</p>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <p className="text-sm text-gray-400 font-medium mb-1">Alamat</p>
                            <p className="text-gray-200">{mustahiq.address || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-medium mb-1">Diinput Oleh</p>
                            <p className="text-gray-200">{mustahiq.inputByName || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-medium mb-1">Status Kelayakan</p>
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border mt-1
                                                ${mustahiq.status === 'Layak' ? 'bg-slate-800 text-slate-300 border-slate-700' :
                                    mustahiq.status === 'Tidak Layak' ? 'bg-slate-800/80 text-slate-400 border-slate-700/80' :
                                        'bg-slate-800/50 text-slate-300 border-slate-700/50'}`}>
                                {mustahiq.status}
                            </span>
                        </div>
                    </div>
                </div >
            </div >

            {/* Zakat History Section */}
            <div className="glass-card p-6" >
                <h3 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-4">Riwayat Penerimaan Zakat</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="glass-table-th">Tanggal</th>
                                <th className="glass-table-th">Kategori</th>
                                <th className="glass-table-th">Jumlah</th>
                                <th className="glass-table-th">Metode</th>
                                <th className="glass-table-th">Petugas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.map((t: any) => (
                                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="glass-table-td text-sm text-gray-300">
                                        {new Date(t.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="glass-table-td">
                                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="glass-table-td text-sm font-bold text-slate-200">
                                        {formatCurrency(t.amount)}
                                    </td>
                                    <td className="glass-table-td">
                                        <div className="text-sm font-medium text-gray-200">{t.distributionMethod || 'Cash'}</div>
                                        {t.distributionMethod === 'Titip' && t.entrustedTo && (
                                            <div className="text-xs text-slate-400/70 mt-0.5">via: {t.entrustedTo}</div>
                                        )}
                                    </td>
                                    <td className="glass-table-td text-sm text-gray-400">
                                        {t.distributedByName || '-'}
                                    </td>
                                </tr>
                            ))}
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada riwayat penerimaan zakat.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div >
        </div>
    )

    {/* Edit Modal (Sama seperti di MustahiqList) */ }
    {
        showModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700/20 blur-2xl rounded-full"></div>
                    <h3 className="text-xl font-bold mb-6 text-white relative z-10">Edit Data Mustahiq</h3>
                    <form onSubmit={handleEditSubmit} className="space-y-4 relative z-10">
                        <div>
                            <label className="glass-label">Nama Lengkap</label>
                            <input
                                type="text" required
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
                                <label className="glass-label">NIK</label>
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
                            <label className="glass-label">Alamat (Opsional)</label>
                            <textarea
                                rows={3}
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
        )
    }
    {
        previewImageUrl && (
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
        )
    }
};
