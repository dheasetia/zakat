import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-zakat-key';

// Register (Biasanya hanya Admin yang bisa buat akun, tapi kita buka dulu untuk setup awal)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        const existingUser = await db.select().from(users).where(eq(users.email, email));
        if (existingUser.length > 0) {
            res.status(400).json({ message: 'Email sudah terdaftar.' });
            return;
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUserArray = await db.insert(users).values({
            name,
            email,
            passwordHash,
            role: role || 'MUZAKKI'
        }).returning({ id: users.id, name: users.name, email: users.email, role: users.role });

        res.status(201).json({ message: 'User berhasil didaftarkan.', user: newUserArray[0] });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Find user
        const userArray = await db.select().from(users).where(eq(users.email, email));
        if (userArray.length === 0) {
            res.status(400).json({ message: 'Email atau password salah.' });
            return;
        }

        const user = userArray[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(400).json({ message: 'Email atau password salah.' });
            return;
        }

        // Generate Token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

export default router;
