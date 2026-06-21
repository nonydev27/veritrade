const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth.routes');
const escrowRoutes = require('./routes/escrow.routes');
const ussdRoutes = require('./routes/ussd.routes');
const moolreController = require('./controllers/moolre.controller');

const app = express();
app.use(cors());

// preserve raw body for webhook verification
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString(); } }));

app.use('/api/auth', authRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/ussd', ussdRoutes);
app.post('/api/moolre/webhook', moolreController.webhook);

app.get('/', (req,res)=> res.send('VeriTrade API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server started on ${PORT}`));
