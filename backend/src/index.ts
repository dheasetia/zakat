import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import muzakkiRoutes from './routes/muzakki.routes';
import mustahiqRoutes from './routes/mustahiq.routes';
import zakatMasukRoutes from './routes/zakatMasuk.routes';
import zakatKeluarRoutes from './routes/zakatKeluar.routes';
import dashboardRoutes from './routes/dashboard.routes';
import userRoutes from './routes/user.routes';
import zoneRoutes from './routes/zone.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/muzakki', muzakkiRoutes);
app.use('/api/mustahiq', mustahiqRoutes);
app.use('/api/zakat-masuk', zakatMasukRoutes);
app.use('/api/zakat-keluar', zakatKeluarRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/zones', zoneRoutes);

app.get('/', (req, res) => {
    res.send('Zakat Management API is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

