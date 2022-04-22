const { Schema, model } = require('mongoose');

const financialItemSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    type: {
      type: String,
      required: true,
      enum: ['I', 'E'],
    },
    value: {
      type: Number,
      min: 1,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive'],
    },
    recurring: {
      type: Boolean,
      default: false,
    },
    recurrenceEnd: {
      type: Date,
    },
    savings: {
      type: Boolean,
      default: false,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    origin: {
      type: Schema.Types.ObjectId,
      ref: 'FinancialItem',
    },
    installment: {
      type: Number,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    installments: {
      type: Number,
      min: 2,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
  },
  {
    timeStamps: true,
  }
);

module.exports = model('FinancialItem', financialItemSchema);
