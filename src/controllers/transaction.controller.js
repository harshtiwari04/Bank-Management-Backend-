const mongoose = require('mongoose'); // CHANGED: Imported mongoose to fix "mongoose is not defined" error when starting sessions
const accountModel = require('../models/account.model'); // CHANGED: Imported accountModel so database queries on accounts work
const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const emailService = require('../services/email.service');

/**
 * - Create a new transaction
 */
async function createTransaction(req, res) {
    /**Validate request */
    const { fromAccount, toAccount, amount, indempotencyKey } = req.body;

    // CHANGED: Added basic payload validation
    if (!fromAccount || !toAccount || !amount || !indempotencyKey) {
        return res.status(400).json({ message: "fromAccount, toAccount, amount, and indempotencyKey are required" });
    }

    // CHANGED: Initialized the transaction session inside the function scope
    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();

        // CHANGED: Added verification to make sure both accounts exist before moving money
        const fromUserAccount = await accountModel.findOne(fromAccount).session(session);
        const toUserAccount = await accountModel.findById(toAccount).session(session);

        if (!fromUserAccount || !toUserAccount) {
            return res.status(404).json({ message: "One or both accounts were not found" });
        }

        // CHANGED: Added balance check constraint to avoid illegal negative balances
        if (fromUserAccount.balance < amount) {
            return res.status(400).json({ message: "Insufficient funds in the source account" });
        }

        // CHANGED: Atomically deduct from sender and add to receiver balances
        await accountModel.findByIdAndUpdate(fromAccount, { $inc: { balance: -amount } }, { session });
        await accountModel.findByIdAndUpdate(toAccount, { $inc: { balance: amount } }, { session });

        // CHANGED: Created the transaction record bound to the session
        // Note: For document instances created with `new`, the session option must be passed during `.save({ session })`
        const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount: toUserAccount._id,
            amount,
            indempotencyKey,
            status: "PENDING"
        });

        await transaction.save({ session });

        // CHANGED: Wrapped in an array because Mongoose `.create()` requires array input when options like session are supplied
        await ledgerModel.create([
            {
                account: fromUserAccount._id,
                amount,
                transaction: transaction._id,
                type: "DEBIT"
            },
            {
                account: toUserAccount._id,
                amount,
                transaction: transaction._id,
                type: "CREDIT"
            }
        ], { session });

        // CHANGED: Updated state and saved inside the active transaction session boundaries
        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();

        return res.status(201).json({
            message: "Transaction created successfully",
            transactionId: transaction._id
        });

    } catch (error) {
        // CHANGED: Rolls back all changes if an error pops up anywhere during execution
        await session.abortTransaction();
        return res.status(500).json({ message: error.message || "Transaction failed" });
    } finally {
        // CHANGED: Cleanup hook ensures session closes even if unexpected code exceptions happen
        session.endSession();
    }

    const isTransactionAlreadyExists = await transactionModel.findOne({ indempotencyKey });
    if (isTransactionAlreadyExists.status === "COMPLETED") {
        return res.status(200).json({ message: "Transaction already Processed" });
    }
    else if (isTransactionAlreadyExists.status === "PENDING") {
        return res.status(200).json({ message: "Transaction is still pending" });
    }
    else if (isTransactionAlreadyExists.status === "FAILED") {
        return res.status(500).json({ message: "Transaction has failed" });
    }
    else if (isTransactionAlreadyExists.status === "REVERSED") {
        return res.status(500).json({ message: "Transaction has been reversed" });
    }

    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({ message: "One or both accounts are not active" });
    }
}

async function createInitialFundTransaction(req, res) {
    const { toAccount, amount, indempotencyKey } = req.body;

    if (!toAccount || !amount || !indempotencyKey) {
        return res.status(400).json({ message: "toAccount, amount, and indempotencyKey are required" });
    }

    // CHANGED: Enclosed execution inside a modern transaction workflow block for reliable recovery handling
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // CHANGED: Chained `.session(session)` to guarantee read operations see current transaction states
        const toUserAccount = await accountModel.findById(toAccount).session(session);
        if (!toUserAccount) {
            return res.status(404).json({ message: "To account not found" });
        }

        const fromUserAccount = await accountModel.findOne({ 
            
            user: req.user._id
        }).session(session);

        if (!fromUserAccount) {
            return res.status(404).json({ message: "From account not found for the system user" });
        }

        // CHANGED: Brought the orphan code lines below inside the function body so they execute properly
        const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount: toUserAccount._id,
            amount,
            indempotencyKey,
            status: "PENDING"
        },{session: session});
        
        await transaction.save({ session });

        // CHANGED: Passed ledger objects together within a clean structured array as demanded by Mongoose `.create()` sessions
        const debitLedgerEntry = await ledgerModel.create([
            {
                account: fromUserAccount._id,
                amount,
                transaction: transaction._id,
                type: "DEBIT"
            }],{session: session})

            const creditLedgerEntry = await ledgerModel.create([
            {
                account: toUserAccount._id,
                amount,
                transaction: transaction._id,
                type: "CREDIT"
            }
        ], { session });

        // CHANGED: Balanced system updates - added execution query hooks to update your actual account balances!
        await accountModel.findByIdAndUpdate(fromUserAccount._id, { $inc: { balance: -amount } }, { session });
        await accountModel.findByIdAndUpdate(toUserAccount._id, { $inc: { balance: amount } }, { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();

        return res.status(201).json({
            message: "Initial fund transaction created successfully",
            transactionId: transaction._id
        });

    } catch (error) {
        // CHANGED: Safe catch trigger to dump operations cleanly if error flags trip
        await session.abortTransaction();
        return res.status(500).json({ message: error.message || "Initial fund transaction failed" });
    } finally {
        // CHANGED: Closes connection loops gracefully 
        session.endSession();
    }
    await emailService.sendEmail({
        to: req.user.email,
        subject: "Initial Fund Transaction Notification",
        text: `An initial fund transaction of amount ${amount} has been created for your account ${toAccount}.`
    }); 
}

module.exports = {
    createTransaction,
    createInitialFundTransaction
};