const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');

const defaultCategories = [
  {
    title: 'Pessoal',
    color: '#EDE9FE',
  },
  {
    title: 'Saúde',
    color: '#ECFCCB',
  },
  {
    title: 'Moradia',
    color: '#FEF9C3',
  },
  {
    title: 'Transporte',
    color: '#CFFAFE',
  },
  {
    title: 'Alimentação',
    color: '#FFEDD5',
  },
  {
    title: 'Educação',
    color: '#DBEAFE',
  },
  {
    title: 'Imprevistos',
    color: '#FCE7F3',
  },
  {
    title: 'Outros',
    color: '#E4E4E7',
  },
];

const router = Router();

router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      throw new Error('All fields are required');
    }

    const user = await User.findOne({ email });

    if (user) {
      throw new Error('E-mail already in use');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      email,
      passwordHash,
    });

    const { _id } = newUser;

    console.log(_id);

    defaultCategories.forEach(async (category) => {
      const newCategory = await Category.create({ ...category, user: _id });
      const categoryId = newCategory._id;
      await User.findByIdAndUpdate(_id, { $push: { categories: categoryId } });
    });

    res.status(201).json({
      username: newUser.username,
      email: newUser.email,
    });
  } catch (error) {
    if (error.message === 'User already exists') {
      res.status(400).json({ msg: error.message });
      return;
    }
    res.status(400).json({ msg: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('Invalid e-mail or password');
    }

    const compareHash = await bcrypt.compare(password, user.passwordHash);

    if (!compareHash) {
      throw new Error('Invalid e-mail or password');
    }

    const payload = {
      username: user.username,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.SECRET_JWT, {
      expiresIn: '1day',
    });

    res.status(200).json({ payload, token });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

module.exports = router;
