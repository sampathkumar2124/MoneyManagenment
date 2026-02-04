const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "movie",
        "fuel",
        "food",
        "loan",
        "medical",
        "clothes",
        "things",
        "others",
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    division: {
      type: String,
      enum: ["Office", "Personal"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastEditedByUser: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

transactionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
