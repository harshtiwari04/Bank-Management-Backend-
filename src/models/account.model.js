const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "Account must belong to a user"]
    },
    status: {
      type: String, 
      enum: {
        values: ["Active", "Frozen", "Closed"],
        message: "Status must be either Active, Frozen or Closed"
      },
      default: "Active" // Corrected: placed outside the enum object
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "INR"
    }
  },
  {
    timestamps: true 
  }
);

// Partial unique compound index to allow only one non-closed account per user
accountSchema.index(
  { user: 1, status: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: { $ne: "Closed" } } 
  }
);

// Instance method to calculate current balance
accountSchema.methods.getBalance = async function() {
  const accountId = this._id;

  const result = await mongoose.model('Ledger').aggregate([
    // 1. Filter documents for this specific account and types
    { 
      $match: { 
        account: accountId, 
        type: { $in: ["CREDIT", "DEBIT"] } 
      } 
    },
    
    // 2. Conditionally sum based on the ledger transaction type
    { 
      $group: { 
        _id: null, 
        totalCredit: { 
          $sum: { 
            $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0] 
          } 
        },
        totalDebit: { 
          $sum: { 
            $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0] 
          } 
        }
      } 
    },
    
    // 3. Compute net balance
    { 
      $project: { 
        _id: 0, 
        balance: { 
          $subtract: [
            { $ifNull: ["$totalCredit", 0] }, 
            { $ifNull: ["$totalDebit", 0] }
          ] 
        } 
      } 
    }
  ]);

  // If no transactions exist, result[0] is undefined; safely fallback to 0
  return result[0]?.balance || 0;
};

const accountModel = mongoose.model('Account', accountSchema);

module.exports = accountModel;