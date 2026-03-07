import { Router, Response } from 'express';
import { db } from '../db';
import { muzakki } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateToken, requireRole, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// Get all muzakki (Admin Only)
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const allMuzakki = await db.select().from(muzakki);
        res.json(allMuzakki);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// Create new muzakki (Admin Only)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const { name, phone, address, userId } = req.body;
        const newMuzakki = await db.insert(muzakki).values({
            name,
            phone,
            address,
            userId // Optional
        }).returning();
        res.status(201).json(newMuzakki[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal menambahkan data Muzakki.' });
    }
});

export default router;
