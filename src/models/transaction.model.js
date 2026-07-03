const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema(
    {
        fromAccount: {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Account",
            required : [true, "From account is required"],
            index : true 
        },

        toAccount: {
    },

    status: {
        type : String,
        enum : { 
            values : ["PENDING", "COMPLETED", "FAILED"],
            message : "Status must be either PENDING, COMPLETED or FAILED"
        },
        default : "PENDING" 
    },
    Amount: {
        type : Number,
        required : [true, "Amount is required"],
        min : [0, "Amount must be greater than 0"]
    },
    indempotencyKey: {
        type : String,
        required : [true, "Indempotency key is required for creating a transaction"],
        unique : true
    },}
    ,{
        timestamps : true
    }

)
   const transactionModel = mongoose.model("Transaction", transactionSchema)

   module.exports = transactionModel