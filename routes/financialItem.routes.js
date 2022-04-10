const { Router } = require('express');
const FinancialItem = require('../models/FinancialItem');
const User = require('../models/User');

function formatDate(month, modifier) {
  const reqMonth = month.split('-');
  const newDate = new Date(
    Number(reqMonth[0]),
    Number(reqMonth[1]) - modifier,
    modifier
  );
  const formattedDate = newDate.toISOString().slice(0, 10);

  return `${formattedDate}T00:00:00.000Z`;
}

const router = Router();

router.post('/', async (req, res) => {
  const { email } = req.user;

  try {
    const userId = await User.findOne({ email }).select('_id');
    const newFinancialItem = await FinancialItem.create({
      ...req.body,
      user: userId._id,
    });
    const { _id } = newFinancialItem;
    await User.findOneAndUpdate({ email }, { $push: { financialItems: _id } });

    res.status(201).json(newFinancialItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/months/:month', async (req, res) => {
  const { month } = req.params;
  const startDate = formatDate(month, 1);
  const endDate = formatDate(month, 0);

  try {
    const financialItems = await FinancialItem.find({
      date: { $gte: startDate, $lte: endDate },
      status: 'active',
      recurring: false,
    }).sort({ date: 1 });

    const recurringItems = await FinancialItem.find({
      date: { $lte: endDate },
      $or: [
        { recurrenceEnd: { $eq: null } },
        { recurrenceEnd: { $gte: endDate } },
      ],
      status: 'active',
      recurring: true,
    });

    res.status(200).json([...recurringItems, ...financialItems]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
