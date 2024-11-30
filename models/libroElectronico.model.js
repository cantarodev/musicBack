const mongoose = require("mongoose");

const libroElectronicoSchema = new mongoose.Schema(
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
    count: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      maxlength: 15,
    },
    size: {
      type: Number,
    },
    path: {
      type: String,
      required: true,
    },
    data: {
      type: Array,
      default: [],
    },
    general_status: {
      type: String,
      default: "pending",
    },
    is_cpe_validated: {
      type: Boolean,
      default: false,
    },
    is_tc_validated: {
      type: Boolean,
      default: false,
    },
    is_rus_validated: {
      type: Boolean,
      default: false,
    },
    data_loaded: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    underscored: true,
  }
);

const LibroElectronico = mongoose.model(
  "LibroElectronico",
  libroElectronicoSchema
);

module.exports = LibroElectronico;
