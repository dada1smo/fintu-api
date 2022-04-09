const { Schema, model } = require('mongoose');

const categorySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 28,
    },
    color: {
      type: String,
      required: true,
      enum: [
        '#EDE9FE',
        '#FEF9C3',
        '#CFFAFE',
        '#DBEAFE',
        '#E4E4E7',
        '#ECFCCB',
        '#FCE7F3',
        '#FFEDD5',
      ],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timeStamps: true,
  }
);

module.exports = model('Category', categorySchema);
