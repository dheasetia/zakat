import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { db } from '../db';
import { zakatKeluar, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateToken, requireRole, AuthRequest } from '../middlewares/auth.middleware';

// Configure multer storage
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const router = Router();

// Get all zakat keluar (Admin Only)
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const records = await db.select({
            id: zakatKeluar.id,
            mustahiqId: zakatKeluar.mustahiqId,
            amount: zakatKeluar.amount,
            category: zakatKeluar.category,
            distributionMethod: zakatKeluar.distributionMethod,
            entrustedTo: zakatKeluar.entrustedTo,
            proofImageUrl: zakatKeluar.proofImageUrl,
            date: zakatKeluar.date,
            distributedBy: zakatKeluar.distributedBy,
            distributedByName: users.name
        })
            .from(zakatKeluar)
            .leftJoin(users, eq(zakatKeluar.distributedBy, users.id));
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// Record new Zakat Keluar (Admin & Pembagi)
router.post('/', authenticateToken, requireRole(['ADMIN', 'PEMBAGI']), upload.single('proofImage'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const { mustahiqId, amount, category, distributionMethod, entrustedTo } = req.body;
        const proofImageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const newRecord = await db.insert(zakatKeluar).values({
            mustahiqId,
            amount: amount.toString(),
            category,
            distributionMethod: distributionMethod || 'Cash',
            entrustedTo: entrustedTo || null,
            proofImageUrl,
            distributedBy: req.user.userId
        }).returning();

        res.status(201).json(newRecord[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mencatat Penyaluran Zakat.' });
    }
});

// Delete Zakat Keluar (Admin Only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const deletedRecord = await db.delete(zakatKeluar).where(eq(zakatKeluar.id, id)).returning();

        if (deletedRecord.length === 0) {
            res.status(404).json({ message: 'Data tidak ditemukan.' });
            return;
        }

        res.json({ message: 'Data berhasil dihapus.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menghapus data Penyaluran Zakat.' });
    }
});

export default router;
