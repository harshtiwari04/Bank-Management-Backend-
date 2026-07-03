const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); //  Fixed typo 'bcrrypt' -> 'bcrypt'

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
            unique: true // Note: unique doesn't take a custom error array like 'required' does in MongoDB/Mongoose indexes.
        },
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            trim: true,
            minlength: [6, "Password must be at least 6 characters long"],
            select: false
        },
        systemUser: {
            type: Boolean,
            default: false,
            immutable: true ,
            select: false
        }
    }, //  Closed the fields object properly
    {
        timestamps: true //  Correct options object position & made plural 'timestamps'
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return ;
    }
    // Fixed typo 'bcrrypt' -> 'bcrypt'
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    return ;
});

// Compare password method
//  Fixed capitalization 'userschema' -> 'userSchema'
userSchema.methods.comparePassword = async function (password) {
    // Fixed typo 'bcrrypt' -> 'bcrypt'
    return await bcrypt.compare(password, this.password);
};

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;