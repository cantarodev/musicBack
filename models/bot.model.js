const mongoose = require("mongoose");

const botSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "active",
    },
    description: {
      type: String,
    },
    identifier_tag: {
      type: String,
      required: true,
    },
    required_clave_sol: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    underscored: true,
  }
);

const Bot = mongoose.model("Bot", botSchema);

module.exports = Bot;
