import { Router, Response } from 'express';
import { db } from '../db';
import { zakatMasuk } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateToken, requireRole, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// Get all zakat masuk (Admin Only)
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const records = await db.select().from(zakatMasuk);
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// Record new Zakat Masuk (Admin Only)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const { muzakkiId, amount, category } = req.body;
        const newRecord = await db.insert(zakatMasuk).values({
            muzakkiId,
            amount,
            category,
            receivedBy: req.user.userId
        }).returning();

        res.status(201).json(newRecord[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mencatat Zakat Masuk.' });
    }
});

// Delete Zakat Masuk (Admin Only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedRecord = await db.delete(zakatMasuk).where(eq(zakatMasuk.id, id)).returning();

        if (deletedRecord.length === 0) {
            res.status(404).json({ message: 'Data tidak ditemukan.' });
            return;
        }

        res.json({ message: 'Data berhasil dihapus.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menghapus data Zakat Masuk.' });
    }
});

export default router;
