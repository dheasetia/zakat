import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-zakat-key';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Akses Ditolak. Token tidak ditemukan.' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            res.status(403).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
            return;
        }
        req.user = user as { userId: string; role: string };
        next();
    });
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Akses Ditolak. Silakan login.' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: `Akses Ditolak. Membutuhkan Role: ${roles.join(', ')}` });
            return;
        }

        next();
    };
};
