const express = require('express');
const router = express.Router();
const { handleUssd } = require('../services/ussd.service');

router.post('/', async (req, res) => {
  try{
    const { phone, text } = req.body || {};
    if(!phone) return res.status(400).json({ error: 'missing phone' });
    const result = await handleUssd(phone, text);
    return res.json({ response: result.reply });
  }catch(err){
    console.error(err.message || err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
