import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateToken, requireRole, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// Get all users (Admin Only)
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const allUsers = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            isActive: users.isActive,
            createdAt: users.createdAt
        }).from(users);

        res.json(allUsers);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil data pengguna.' });
    }
});

// Create new user (Admin Only)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        const existingUser = await db.select().from(users).where(eq(users.email, email));
        if (existingUser.length > 0) {
            res.status(400).json({ message: 'Email sudah terdaftar.' });
            return;
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = await db.insert(users).values({
            name,
            email,
            passwordHash,
            role: role || 'MUZAKKI',
            isActive: true
        }).returning({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            isActive: users.isActive
        });

        res.status(201).json(newUser[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal menambahkan pengguna baru.' });
    }
});

// Edit user details and roles (Admin Only)
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { name, email, role, password } = req.body;

        const updateData: any = { name, email, role };

        if (password) {
            const saltRounds = 10;
            updateData.passwordHash = await bcrypt.hash(password, saltRounds);
        }

        const updated = await db.update(users)
            .set(updateData)
            .where(eq(users.id, id))
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                isActive: users.isActive
            });

        if (updated.length === 0) {
            res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
            return;
        }

        res.json(updated[0]);
    } catch (err) {
        res.status(500).json({ message: 'Gagal mengubah data pengguna.' });
    }
});

// Block/Unblock user (Admin Only)
router.patch('/:id/status', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { isActive } = req.body;

        // Preventing admin from blocking themselves
        if (req.user?.userId === id && isActive === false) {
            res.status(400).json({ message: 'Admin tidak dapat memblokir dirinya sendiri.' });
            return;
        }

        const updated = await db.update(users)
            .set({ isActive })
            .where(eq(users.id, id))
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                isActive: users.isActive
            });

        if (updated.length === 0) {
            res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
            return;
        }

        res.json(updated[0]);
    } catch (err) {
        res.status(500).json({ message: 'Gagal mengubah status pengguna.' });
    }
});

// Delete user (Admin Only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        // Preventing admin from deleting themselves
        if (req.user?.userId === id) {
            res.status(400).json({ message: 'Admin tidak dapat menghapus akunnya sendiri.' });
            return;
        }

        await db.delete(users).where(eq(users.id, id));
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Gagal menghapus pengguna. (Kemungkinan masih ada data transaksi terkait)' });
    }
});

export default router;
