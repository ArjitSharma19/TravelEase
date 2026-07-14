const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get checklist
router.get('/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ checklist: user.checklist || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save/update checklist
router.post('/:email', async (req, res) => {
  try {
    const { checklist } = req.body;
    const user = await User.findOneAndUpdate(
      { email: req.params.email.toLowerCase() },
      { checklist },
      { new: true, upsert: false }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, checklist: user.checklist });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
