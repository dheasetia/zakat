import { Router } from 'express';
import { db } from '../db';
import { zones } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateToken as verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// GET all zones
// Accessible to all authenticated users (Admin, Pembagi, Muzakki)
router.get('/', verifyToken, async (req, res) => {
    try {
        const allZones = await db.select().from(zones).orderBy(zones.name);
        res.json({ message: 'Success', total: allZones.length, data: allZones });
    } catch (error) {
        console.error("Error fetching zones:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

// POST a new zone
// Only ADMIN can create zones
router.post('/', verifyToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Nama zona asnaf wajib diisi' });
        }

        const newZone = await db.insert(zones).values({
            name,
            description
        }).returning();

        res.status(201).json({ message: 'Zona asnaf berhasil ditambahkan', zone: newZone[0] });
    } catch (error: any) {
        console.error("Error creating zone:", error);
        if (error.code === '23505') { // Unique constraint violation (PostgreSQL)
            return res.status(400).json({ message: 'Nama zona sudah ada, gunakan nama lain' });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

// PUT (update) an existing zone
// Only ADMIN can edit zones
router.put('/:id', verifyToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const id = req.params.id as string;
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Nama zona asnaf wajib diisi' });
        }

        const updatedZone = await db.update(zones)
            .set({ name, description })
            .where(eq(zones.id, parseInt(id)))
            .returning();

        if (updatedZone.length === 0) {
            return res.status(404).json({ message: 'Zona asnaf tidak ditemukan' });
        }

        res.json({ message: 'Zona asnaf berhasil diperbarui', zone: updatedZone[0] });
    } catch (error: any) {
        console.error("Error updating zone:", error);
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Nama zona sudah ada, gunakan nama lain' });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

// DELETE a zone
// Only ADMIN can delete zones
router.delete('/:id', verifyToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const id = req.params.id as string;

        const deletedZone = await db.delete(zones)
            .where(eq(zones.id, parseInt(id)))
            .returning();

        if (deletedZone.length === 0) {
            return res.status(404).json({ message: 'Zona asnaf tidak ditemukan' });
        }

        res.json({ message: 'Zona asnaf berhasil dihapus', zone: deletedZone[0] });
    } catch (error: any) {
        console.error("Error deleting zone:", error);
        if (error.code === '23503') { // Foreign key constraint violation
            return res.status(400).json({ message: 'Tidak dapat menghapus zona ini karena masih digunakan oleh data Mustahiq' });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

export default router;
