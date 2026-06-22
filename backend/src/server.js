const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes   = require('./routes/auth.routes');
const escrowRoutes = require('./routes/escrow.routes');
const ussdRoutes   = require('./routes/ussd.routes');
const moolreRoutes = require('./routes/moolre.routes');

const app = express();
app.use(cors());

// Preserve raw body for Moolre webhook HMAC signature verification
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf.toString(); } }));

app.use('/api/auth',   authRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/ussd',   ussdRoutes);
app.use('/api/moolre', moolreRoutes);

app.get('/', (_req, res) => res.send('VeriTrade API Running ✓'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
