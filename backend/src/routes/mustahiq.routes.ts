import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { db } from '../db';
import { mustahiq, users, zakatKeluar, zones } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
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

// Get all mustahiq (Admin, Pembagi & Muzakki)
router.get('/', authenticateToken, requireRole(['ADMIN', 'PEMBAGI', 'MUZAKKI']), async (req: AuthRequest, res: Response) => {
    try {
        const allMustahiq = await db.select({
            id: mustahiq.id,
            name: mustahiq.name,
            nik: mustahiq.nik,
            phone: mustahiq.phone,
            address: mustahiq.address,
            gender: mustahiq.gender,
            age: mustahiq.age,
            priorityLevel: mustahiq.priorityLevel,
            idCardImageUrl: mustahiq.idCardImageUrl,
            profileImageUrl: mustahiq.profileImageUrl,
            asnafCategory: mustahiq.asnafCategory,
            status: mustahiq.status,
            zoneId: mustahiq.zoneId,
            zoneName: zones.name,
            inputBy: mustahiq.inputBy,
            inputByName: users.name,
            createdAt: mustahiq.createdAt,
            receiveCount: sql<number>`CAST(count(${zakatKeluar.id}) AS INTEGER)`.as('receiveCount'),
            totalReceived: sql<number>`COALESCE(sum(${zakatKeluar.amount}), 0)`.as('totalReceived')
        })
            .from(mustahiq)
            .leftJoin(users, eq(mustahiq.inputBy, users.id))
            .leftJoin(zones, eq(mustahiq.zoneId, zones.id))
            .leftJoin(zakatKeluar, eq(mustahiq.id, zakatKeluar.mustahiqId))
            .groupBy(mustahiq.id, users.id, zones.id);

        res.json(allMustahiq);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// Get single mustahiq detail with history (Admin, Pembagi & Muzakki)
router.get('/:id', authenticateToken, requireRole(['ADMIN', 'PEMBAGI', 'MUZAKKI']), async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const mustahiqRecord = await db.select({
            id: mustahiq.id,
            name: mustahiq.name,
            nik: mustahiq.nik,
            phone: mustahiq.phone,
            address: mustahiq.address,
            gender: mustahiq.gender,
            age: mustahiq.age,
            priorityLevel: mustahiq.priorityLevel,
            idCardImageUrl: mustahiq.idCardImageUrl,
            profileImageUrl: mustahiq.profileImageUrl,
            asnafCategory: mustahiq.asnafCategory,
            status: mustahiq.status,
            zoneId: mustahiq.zoneId,
            zoneName: zones.name,
            inputBy: mustahiq.inputBy,
            inputByName: users.name,
            createdAt: mustahiq.createdAt
        })
            .from(mustahiq)
            .leftJoin(users, eq(mustahiq.inputBy, users.id))
            .leftJoin(zones, eq(mustahiq.zoneId, zones.id))
            .where(eq(mustahiq.id, id));

        if (mustahiqRecord.length === 0) {
            res.status(404).json({ message: 'Mustahiq tidak ditemukan' });
            return;
        }

        const history = await db.select({
            id: zakatKeluar.id,
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
            .leftJoin(users, eq(zakatKeluar.distributedBy, users.id))
            .where(eq(zakatKeluar.mustahiqId, id))
            .orderBy(desc(zakatKeluar.date));

        res.json({
            mustahiq: mustahiqRecord[0],
            history
        });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// Create new mustahiq (Admin Only)
router.post('/', authenticateToken, requireRole(['ADMIN', 'PEMBAGI']), upload.fields([{ name: 'idCardImage', maxCount: 1 }, { name: 'profileImage', maxCount: 1 }]), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const { name, nik, phone, address, gender, age, priorityLevel, asnafCategory, zoneId } = req.body;

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const idCardImageUrl = files?.idCardImage?.[0] ? `/uploads/${files.idCardImage[0].filename}` : null;
        const profileImageUrl = files?.profileImage?.[0] ? `/uploads/${files.profileImage[0].filename}` : null;

        const newMustahiq = await db.insert(mustahiq).values({
            name,
            nik: nik || null,
            phone,
            address,
            gender: gender || null,
            age: age ? parseInt(age) : null,
            priorityLevel: priorityLevel ? parseInt(priorityLevel) : null,
            idCardImageUrl,
            profileImageUrl,
            asnafCategory,
            zoneId: zoneId ? parseInt(zoneId) : null,
            inputBy: req.user.userId
        }).returning();
        res.status(201).json(newMustahiq[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal menambahkan data Mustahiq.' });
    }
});

// Update Status Mustahiq (Admin Only)
router.patch('/:id/status', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body; // 'Menunggu Survei', 'Layak', 'Tidak Layak'

        const updated = await db.update(mustahiq)
            .set({ status })
            .where(eq(mustahiq.id, id))
            .returning();

        res.json(updated[0]);
    } catch (err) {
        res.status(500).json({ message: 'Gagal update status.' });
    }
});

// Update Mustahiq (Admin & Pembagi)
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'PEMBAGI']), upload.fields([{ name: 'idCardImage', maxCount: 1 }, { name: 'profileImage', maxCount: 1 }]), async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, nik, phone, address, gender, age, priorityLevel, asnafCategory, zoneId } = req.body;

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const idCardImageUrl = files?.idCardImage?.[0] ? `/uploads/${files.idCardImage[0].filename}` : undefined;
        const profileImageUrl = files?.profileImage?.[0] ? `/uploads/${files.profileImage[0].filename}` : undefined;

        const updateData: any = {
            name, nik: nik || null, phone, address, asnafCategory,
            gender: gender || null,
            age: age ? parseInt(age) : null,
            priorityLevel: priorityLevel ? parseInt(priorityLevel) : null,
            zoneId: zoneId ? parseInt(zoneId) : null,
        };

        if (idCardImageUrl !== undefined) updateData.idCardImageUrl = idCardImageUrl;
        if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;

        const updated = await db.update(mustahiq)
            .set(updateData)
            .where(eq(mustahiq.id, id))
            .returning();

        res.json(updated[0]);
    } catch (err) {
        res.status(500).json({ message: 'Gagal update data Mustahiq.' });
    }
});

// Delete Mustahiq (Admin & Pembagi)
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'PEMBAGI']), async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        await db.delete(mustahiq).where(eq(mustahiq.id, id));
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Gagal menghapus data Mustahiq. (Pastikan tidak ada relasi di zakat keluar)' });
    }
});

export default router;
