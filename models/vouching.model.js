const mongoose = require("mongoose");

const vouching = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    ruc_account: {
      type: String,
      required: true,
      maxlength: 11,
    },
    name: {
      type: String,
      required: true,
      maxlength: 37,
    },
    period: {
      type: String,
      required: true,
      maxlength: 10,
    },
    size: {
      type: Number,
    },
    path: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    underscored: true,
  }
);

const Vouching = mongoose.model("Vouching", vouching);

module.exports = Vouching;
