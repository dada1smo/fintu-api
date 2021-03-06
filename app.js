require('dotenv').config();

const express = require('express');
const connectDb = require('./config/db.config');
const cors = require('cors');

connectDb();

const app = express();

app.use(express.json());

app.use(cors());

app.listen(process.env.PORT, () =>
  console.log(`Server running on port: ${process.env.PORT}`)
);

app.use('/auth', require('./routes/auth.routes'));

app.use(require('./middlewares/auth.middlewares'));

app.use('/financial-items', require('./routes/financialItem.routes'));

app.use('/categories', require('./routes/category.routes'));
