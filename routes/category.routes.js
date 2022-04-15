const { Router } = require('express');

const Category = require('../models/Category');
const FinancialItem = require('../models/FinancialItem');
const User = require('../models/User');

const router = Router();

router.post('/', async (req, res) => {
  const { email } = req.user;

  try {
    const userId = await User.findOne({ email }).select('_id');

    const newCategory = await Category.create({
      ...req.body,
      user: userId._id,
    });

    const { _id } = newCategory;

    await User.findOneAndUpdate({ email }, { $push: { categories: _id } });

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  const { email } = req.user;

  try {
    const userId = await User.findOne({ email }).select('_id');

    const allCategories = await Category.find({ user: userId });

    res.status(201).json(allCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { email } = req.user;
  const { id } = req.params;

  try {
    const userId = await User.findOne({ email }).select('_id');
    const { user } = await Category.findOne({ id });

    if (userId._id.valueOf() !== user.valueOf()) {
      throw new Error("Can't edit another user's category");
    }

    const { title, color } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        title,
        color,
        user: userId._id,
      },
      {
        new: true,
      }
    );

    res.status(201).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { email } = req.user;
  const { id } = req.params;

  try {
    const userId = await User.findOne({ email }).select('_id');
    const { user } = await Category.findOne({ id });

    if (userId._id.valueOf() !== user.valueOf()) {
      throw new Error("Can't delete another user's category");
    }

    await Category.findByIdAndDelete(id);
    await User.findOneAndUpdate(
      { category: id },
      { $pull: { categories: id } }
    );
    await FinancialItem.updateMany({ category: id }, { category: null });

    res.status(200).json('Successfully deleted item');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
