const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      maxLength: 12,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please enter a valid e-mail',
      ],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    financialItems: [{ type: Schema.Types.ObjectId, ref: 'FinancialItem' }],
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  },
  {
    timeStamps: true,
  }
);

module.exports = model('User', userSchema);
