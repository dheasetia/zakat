import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'MUZAKKI'
    });

    const roleOptions = ['ADMIN', 'PEMBAGI', 'MUZAKKI'];

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                // If editing, only send password if it's filled
                const payload: any = { ...formData };
                if (!payload.password) {
                    payload.password = undefined;
                }

                await api.put(`/users/${editingId}`, payload);
            } else {
                if (!formData.password) {
                    alert('Password diperlukan untuk membuat pengguna baru.');
                    setSubmitting(false);
                    return;
                }
                await api.post('/users', formData);
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ name: '', email: '', password: '', role: 'MUZAKKI' });
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal menyimpan data pengguna');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (u: any) => {
        setEditingId(u.id);
        setFormData({
            name: u.name,
            email: u.email,
            password: '', // Left blank intentionally
            role: u.role
        });
        setShowModal(true);
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean, email: string) => {
        if (currentUser?.email === email) {
            alert('Anda tidak bisa memblokir akun Anda sendiri.');
            return;
        }

        const actionText = currentStatus ? 'memblokir' : 'mengaktifkan kembali';
        if (window.confirm(`Yakin ingin ${actionText} pengguna ini?`)) {
            try {
                await api.patch(`/users/${id}/status`, { isActive: !currentStatus });
                fetchUsers();
            } catch (error: any) {
                alert(error.response?.data?.message || `Gagal ${actionText} pengguna`);
            }
        }
    };

    const handleDelete = async (id: string, email: string) => {
        if (currentUser?.email === email) {
            alert('Anda tidak bisa menghapus akun Anda sendiri.');
            return;
        }

        if (window.confirm('Yakin ingin menghapus secara permanen pengguna ini? Proses ini tidak bisa dibatalkan.')) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
            } catch (error: any) {
                alert(error.response?.data?.message || 'Gagal menghapus pengguna. (Terdapat relasi transaksi, sebaiknya gunakan fitur Banned/Block)');
            }
        }
    };

    if (loading) return <div>Memuat...</div>;

    return (
        <>
            <div className="glass-card p-6 relative mb-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/20 blur-3xl rounded-full pointer-events-none"></div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Manajemen Pengguna</h2>
                        <p className="text-sm text-gray-400 mt-1">Kelola akses dan akun sistem</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ name: '', email: '', password: '', role: 'MUZAKKI' });
                            setShowModal(true);
                        }}
                        className="btn-primary w-full sm:w-auto flex items-center justify-center p-0 px-5"
                        style={{ height: '42px' }}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Tambah Pengguna
                    </button>
                </div>

                <div className="overflow-x-auto relative z-10">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="glass-table-th">Nama & Email</th>
                                <th className="glass-table-th">Role / Jabatan</th>
                                <th className="glass-table-th">Status Akses</th>
                                <th className="glass-table-th">Didaftarkan Pada</th>
                                <th className="glass-table-th text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="glass-table-td">
                                        <div className="font-bold text-white mb-0.5">{u.name}</div>
                                        <div className="text-sm text-gray-400">{u.email}</div>
                                    </td>
                                    <td className="glass-table-td">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border
                                        ${u.role === 'ADMIN' ? 'bg-slate-700 text-slate-200 border-slate-600' :
                                                u.role === 'PEMBAGI' ? 'bg-slate-800/80 text-slate-400 border-slate-700/80' :
                                                    'bg-slate-800/50 text-slate-400 border-slate-700/50'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="glass-table-td">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border
                                        ${u.isActive ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-900/50 text-slate-500 border-slate-800'}`}>
                                            {u.isActive ? 'Aktif' : 'Diblokir'}
                                        </span>
                                    </td>
                                    <td className="glass-table-td text-sm text-gray-400">
                                        {new Date(u.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="glass-table-td text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button
                                                onClick={() => handleEdit(u)}
                                                className="text-slate-400 hover:text-slate-300 transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            {currentUser?.email !== u.email && (
                                                <>
                                                    <button
                                                        onClick={() => handleToggleStatus(u.id, u.isActive, u.email)}
                                                        className={`transition-colors ${u.isActive ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-300'}`}
                                                        title={u.isActive ? "Blokir Akses" : "Buka Blokir"}
                                                    >
                                                        {u.isActive ? (
                                                            <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                        ) : (
                                                            <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(u.id, u.email)}
                                                        className="text-slate-500 hover:text-slate-400 transition-colors"
                                                        title="Hapus Permanen"
                                                    >
                                                        <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada data pengguna.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700/20 blur-2xl rounded-full pointer-events-none"></div>
                        <h3 className="text-xl font-bold mb-6 text-white relative z-10">{editingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
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
                                <label className="glass-label">Email Login</label>
                                <input
                                    type="email" required
                                    className="glass-input"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="glass-label">Role / Hak Akses</label>
                                <select
                                    className="glass-input"
                                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    {roleOptions.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="glass-label">
                                    {editingId ? 'Password Baru (Kosongkan jika tidak ubah)' : 'Password'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingId}
                                    minLength={6}
                                    placeholder={editingId ? 'Ketik password baru...' : ''}
                                    className="glass-input"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
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
