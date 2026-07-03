const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema(
    {
        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            index: true,
            immutable: true,
        },
        amount: {
            type: Number,
            required: [true, "Amount is required for creating a ledger entry"],
            immutable: true,
        },
        transaction: {
           type: mongoose.Schema.Types.ObjectId,
           ref: "Transaction",
           required: [true, "Ledger entry must be associated with a transaction"],
           index: true,
           immutable: true
        },
        type: {
            type: String,
            required: [true, "Ledger entry type is required"], // Moved inside the type block
            immutable: true, // Moved inside the type block
            enum: {
                values: ["CREDIT", "DEBIT"],
                message: "Ledger entry type must be either CREDIT or DEBIT" 
            }
        } // Closed the type block properly here
    },
    {
        timestamps: true // Optional, but usually great for ledgers!
    }
);

function preventLedgerModification(next) {
    throw new Error("Ledger entries cannot be modified or deleted once created");
}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('findOneAndRemove', preventLedgerModification);
ledgerSchema.pre('findOneAndReplace', preventLedgerModification);
ledgerSchema.pre('replaceOne', preventLedgerModification);

const ledgerModel = mongoose.model("Ledger", ledgerSchema);

module.exports = ledgerModel;