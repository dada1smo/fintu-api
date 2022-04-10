const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = Router();

router.post('/signup', async (req, res) => {
  const { name, username, email, password } = req.body;

  try {
    if (!name || !username || !email || !password) {
      throw new Error('All fields are required');
    }

    const user = await User.findOne({ email });

    if (user) {
      throw new Error('E-mail already in use');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      username,
      email,
      passwordHash,
    });

    res.status(201).json({
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
    });
  } catch (error) {
    if (error.message === 'User already exists') {
      res.status(400).json({ msg: error.message });
      return;
    }
    res.status(500).json({ msg: error.message });
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
      name: user.name,
      username: user.username,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.SECRET_JWT, {
      expiresIn: '1day',
    });

    res.status(200).json({ payload, token });
  } catch (error) {
    res.status(401).json({ msg: error.message });
  }
});

module.exports = router;
