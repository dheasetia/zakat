import { Router, Response } from 'express';
import { db } from '../db';
import { muzakki, mustahiq, zakatMasuk, zakatKeluar, users } from '../db/schema';
import { sql, eq, ne } from 'drizzle-orm';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// Get Dashboard Metrics (All Authenticated Users)
router.get('/metrics', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // 1. Total Muzakki
        const totalMuzakkiResult = await db.select({ count: sql<number>`cast(count(${muzakki.id}) as integer)` }).from(muzakki);
        const totalMuzakki = totalMuzakkiResult[0].count;

        // 2. Total Mustahiq
        const totalMustahiqResult = await db.select({ count: sql<number>`cast(count(${mustahiq.id}) as integer)` }).from(mustahiq);
        const totalMustahiq = totalMustahiqResult[0].count;

        // 3. Total Dana Masuk
        const totalMasukResult = await db.select({ total: sql<number>`COALESCE(SUM(${zakatMasuk.amount}), 0)` }).from(zakatMasuk);
        const totalMasuk = Number(totalMasukResult[0].total);

        // 4. Total Dana Keluar
        const totalKeluarResult = await db.select({ total: sql<number>`COALESCE(SUM(${zakatKeluar.amount}), 0)` }).from(zakatKeluar);
        const totalKeluar = Number(totalKeluarResult[0].total);

        // 5. Saldo Terkini
        const currentBalance = totalMasuk - totalKeluar;

        // NEW: Total distributed by me vs others
        let totalDistributedByMe = 0;
        let totalDistributedByOthers = 0;

        if (req.user.role === 'ADMIN' || req.user.role === 'PEMBAGI') {
            const byMeResult = await db.select({ total: sql<number>`COALESCE(SUM(${zakatKeluar.amount}), 0)` })
                .from(zakatKeluar).where(eq(zakatKeluar.distributedBy, req.user.userId));
            totalDistributedByMe = Number(byMeResult[0].total);

            const byOthersResult = await db.select({ total: sql<number>`COALESCE(SUM(${zakatKeluar.amount}), 0)` })
                .from(zakatKeluar).where(ne(zakatKeluar.distributedBy, req.user.userId));
            totalDistributedByOthers = Number(byOthersResult[0].total);
        }

        // (Opsional) 6. Get Recent Transactions
        let recentTransactions: any[] = [];
        if (req.user.role === 'ADMIN' || req.user.role === 'PEMBAGI') {
            const recentMasuk = await db.select({ type: sql`'IN'`, amount: zakatMasuk.amount, date: zakatMasuk.date, category: zakatMasuk.category, distributedByName: sql`NULL` })
                .from(zakatMasuk).orderBy(sql`${zakatMasuk.date} DESC`).limit(5);

            const recentKeluar = await db.select({ type: sql`'OUT'`, amount: zakatKeluar.amount, date: zakatKeluar.date, category: zakatKeluar.category, distributedByName: users.name })
                .from(zakatKeluar)
                .leftJoin(users, eq(zakatKeluar.distributedBy, users.id))
                .orderBy(sql`${zakatKeluar.date} DESC`).limit(5);

            recentTransactions = [...recentMasuk, ...recentKeluar].sort((a, b) => new Date(b.date as unknown as string).getTime() - new Date(a.date as unknown as string).getTime()).slice(0, 5);
        } else if (req.user.role === 'MUZAKKI') {
            const recentKeluar = await db.select({ type: sql`'OUT'`, amount: zakatKeluar.amount, date: zakatKeluar.date, category: zakatKeluar.category, distributedByName: users.name })
                .from(zakatKeluar)
                .leftJoin(users, eq(zakatKeluar.distributedBy, users.id))
                .orderBy(sql`${zakatKeluar.date} DESC`).limit(5);
            recentTransactions = recentKeluar;
        }

        res.json({
            totalMuzakki,
            totalMustahiq,
            totalMasuk,
            totalKeluar,
            currentBalance,
            totalDistributedByMe,
            totalDistributedByOthers,
            recentTransactions
        });

    } catch (error) {
        console.error("Dashboard Metrics Error:", error);
        res.status(500).json({ message: 'Terjadi kesalahan mengambil data dashboard.' });
    }
});

export default router;
