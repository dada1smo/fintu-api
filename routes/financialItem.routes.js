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

function generateMonths(year) {
  const months = [];
  let amount = 1;

  while (amount <= 12) {
    months.push(`${year}-${amount < 10 ? `0${amount}` : amount}`);
    amount += 1;
  }

  return months;
}

function countRecurrences(item, createdAt, today, recurrenceEnd) {
  const endDate = recurrenceEnd < today ? recurrenceEnd : today;

  let amount =
    endDate.getMonth() -
    createdAt.getMonth() +
    12 * (endDate.getFullYear() - createdAt.getFullYear()) +
    1;

  const items = [];
  while (amount > 0) {
    items.push(item);
    amount -= 1;
  }

  return items;
}

async function getMonthlyBalance(userEmail, reqMonth) {
  const startDate = formatDate(reqMonth, 1);
  const endDate = formatDate(reqMonth, 0);

  const userId = await User.findOne({ userEmail }).select('_id');

  const financialItems = await FinancialItem.find({
    date: { $gte: startDate, $lte: endDate },
    status: 'active',
    recurring: false,
    savings: false,
    user: userId._id,
  }).sort({ date: 1 });

  const recurringItems = await FinancialItem.find({
    date: { $lte: endDate },
    $or: [
      { recurrenceEnd: { $eq: null } },
      { recurrenceEnd: { $gte: endDate } },
    ],
    status: 'active',
    recurring: true,
    savings: false,
    user: userId._id,
  }).sort({ date: 1 });

  const periodItems = [...recurringItems, ...financialItems];

  if (periodItems.length === 0) {
    return { month: reqMonth, balance: 'No data' };
  }

  const income = periodItems
    .filter((item) => item.type === 'I')
    .map((item) => item.value)
    .reduce((previousValue, currentValue) => previousValue + currentValue, 0);
  const expenses = periodItems
    .filter((item) => item.type === 'E')
    .map((item) => item.value)
    .reduce((previousValue, currentValue) => previousValue + currentValue, 0);

  return { month: reqMonth, balance: income - expenses };
}

const router = Router();

// create new financial item

router.post('/item', async (req, res) => {
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

// get requested financial item

router.get('/item/:id', async (req, res) => {
  const { email } = req.user;
  const { id } = req.params;

  try {
    const userId = await User.findOne({ email }).select('_id');
    const getFinancialItem = await FinancialItem.findOne({
      _id: id,
      user: userId,
    });

    res.status(200).json(getFinancialItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// edit requested financial item

router.put('/item/:id', async (req, res) => {
  const { email } = req.user;
  const { id } = req.params;

  try {
    const userId = await User.findOne({ email }).select('_id');
    const { user } = await FinancialItem.findOne({ id });

    if (userId._id.valueOf() !== user.valueOf()) {
      throw new Error("Can't edit another user's item");
    }

    const {
      title,
      type,
      value,
      date,
      status,
      recurring,
      recurrenceEnd,
      category,
    } = req.body;

    const updatedFinancialItem = await FinancialItem.findByIdAndUpdate(
      id,
      { title, type, value, date, status, recurring, recurrenceEnd, category },
      {
        new: true,
      }
    );

    res.status(200).json(updatedFinancialItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get all items on requested month

router.get('/months/:month', async (req, res) => {
  const { email } = req.user;
  const { month } = req.params;
  const startDate = formatDate(month, 1);
  const endDate = formatDate(month, 0);

  try {
    const userId = await User.findOne({ email }).select('_id');

    const financialItems = await FinancialItem.find({
      date: { $gte: startDate, $lte: endDate },
      status: 'active',
      recurring: false,
      savings: false,
      user: userId._id,
    }).sort({ date: 1 });

    const recurringItems = await FinancialItem.find({
      date: { $lte: endDate },
      $or: [
        { recurrenceEnd: { $eq: null } },
        { recurrenceEnd: { $gte: endDate } },
      ],
      status: 'active',
      recurring: true,
      savings: false,
      user: userId._id,
    }).sort({ date: 1 });

    res.status(200).json([...recurringItems, ...financialItems]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get balance on requested month

router.get('/months/balance/:month', async (req, res) => {
  const { email } = req.user;
  const { month } = req.params;

  try {
    const balance = await getMonthlyBalance(email, month);

    res.status(200).json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get all monthly balances on requested year

router.get('/year/balance/:year', async (req, res) => {
  const { email } = req.user;
  const { year } = req.params;
  const monthsInYear = generateMonths(year);
  const balances = monthsInYear.map((month) => getMonthlyBalance(email, month));

  try {
    const balance = await Promise.all(balances);

    res.status(200).json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get balance on all items

router.get('/savings', async (req, res) => {
  const { email } = req.user;
  const todayDate = new Date();
  const formatTimezone = `${todayDate
    .toISOString()
    .slice(0, 10)}T00:00:00.000Z`;
  const formatToday = new Date(formatTimezone);

  try {
    const userId = await User.findOne({ email }).select('_id');

    const savingsItems = await FinancialItem.find({
      date: { $lte: todayDate },
      status: 'active',
      recurring: false,
      savings: true,
      user: userId._id,
    }).sort({ date: 1 });

    const financialItems = await FinancialItem.find({
      date: { $lte: todayDate },
      status: 'active',
      recurring: false,
      savings: false,
      user: userId._id,
    }).sort({ date: 1 });

    const recurringItems = await FinancialItem.find({
      date: { $lte: todayDate },
      status: 'active',
      recurring: true,
      savings: false,
      user: userId._id,
    }).sort({ date: 1 });

    const allRecorrences = [];

    recurringItems.forEach((item) => {
      const itemRecurrences = countRecurrences(
        item,
        item.date,
        formatToday,
        item.recurrenceEnd
      );
      itemRecurrences.forEach((recurrence) => allRecorrences.push(recurrence));
    });

    const allItems = [...savingsItems, ...financialItems, ...allRecorrences];
    const income = allItems
      .filter((item) => item.type === 'I')
      .map((item) => item.value)
      .reduce((previousValue, currentValue) => previousValue + currentValue, 0);
    const expenses = allItems
      .filter((item) => item.type === 'E')
      .map((item) => item.value)
      .reduce((previousValue, currentValue) => previousValue + currentValue, 0);

    res.status(200).json(income - expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
