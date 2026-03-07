import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;
    const navLinkClass = (path: string) =>
        `px-4 py-3 rounded-lg transition-all duration-300 whitespace-nowrap flex items-center mb-1 ${isActive(path)
            ? 'bg-slate-800 text-white font-semibold shadow-[inset_4px_0_0_0_#cbd5e1]'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
        }`;

    return (
        <div className="min-h-screen text-gray-300 flex flex-col md:flex-row">
            {/* Sidebar / Topbar */}
            <nav className="glass-card flex-shrink-0 md:w-64 md:h-screen sticky top-0 md:m-4 flex flex-col z-50 rounded-none md:rounded-2xl border-x-0 md:border-x border-y-0 md:border-y border-white/10">
                <div className="p-6 border-b border-white/5 flex justify-between items-center md:block">
                    <div>
                        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Zakat<span className="font-light text-slate-400">App</span></h1>
                    </div>
                    {user && (
                        <div className="md:mt-6 text-sm">
                            <p className="text-slate-400">Halo,</p>
                            <p className="font-semibold text-white truncate">{user.name}</p>
                            <div className="inline-block mt-2 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-medium tracking-wider text-slate-300 uppercase">
                                {user.role}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 flex-1 flex md:flex-col overflow-x-auto md:overflow-y-auto custom-scrollbar">
                    {user ? (
                        <div className="flex md:flex-col gap-1 w-full relative h-full">
                            <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                                <svg className="w-5 h-5 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                Dasbor
                            </Link>

                            {(user.role === 'ADMIN' || user.role === 'PEMBAGI' || user.role === 'MUZAKKI') && (
                                <Link to="/mustahiq" className={navLinkClass('/mustahiq')}>
                                    <svg className="w-5 h-5 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    Mustahiq
                                </Link>
                            )}

                            {(user.role === 'ADMIN' || user.role === 'PEMBAGI') && (
                                <>
                                    <Link to="/zakat-keluar" className={navLinkClass('/zakat-keluar')}>
                                        <svg className="w-5 h-5 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        Zakat Keluar
                                    </Link>
                                </>
                            )}

                            {user.role === 'ADMIN' && (
                                <div className="mt-4 md:mt-6 mb-2">
                                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Menu</p>
                                    <div className="mt-2 space-y-1">
                                        <Link to="/muzakki" className={navLinkClass('/muzakki')}>
                                            <svg className="w-5 h-5 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            Muzakki
                                        </Link>
                                        <Link to="/zakat-masuk" className={navLinkClass('/zakat-masuk')}>
                                            <svg className="w-5 h-5 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                            Zakat Masuk
                                        </Link>
                                        <Link to="/zones" className={navLinkClass('/zones')}>
                                            <svg className="w-5 h-5 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            Manajemen Zona
                                        </Link>
                                        <Link to="/users" className={navLinkClass('/users')}>
                                            <svg className="w-5 h-5 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                            Pengguna
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div className="md:mt-auto pt-4 md:border-t border-white/5 w-full">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center px-4 py-3 text-left hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-colors whitespace-nowrap group"
                                >
                                    <svg className="w-5 h-5 mr-3 opacity-70 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    Keluar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-center font-medium border border-white/10">Masuk Aplikasi</Link>
                    )}
                </div>
            </nav>

            {/* Main Content Arena */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-[1600px] mx-auto z-10 relative">
                <Outlet />
            </main>
        </div>
    );
};
