const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const EmailService = require('../services/email.service');
const sendRegistrationEmail = require('../services/email.service').sendRegistrationEmail;
const tokenBlacklistModel = require('../models/blacklist.model');


/**
 * -user register controller
 * POST /api/auth/register
 */
async function userRegisterUser(req, res) {
    const { email, name, password } = req.body;

    const ifUserExists = await userModel.findOne({ email });
    if (ifUserExists) {
        return res.status(422).json({ 
            message: 'Email already exists' ,
            status : 'failed'
        });
    }

    const user = await userModel.create({ email, name, password });


    const token  = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });

    res.cookie('token', token)

    res.status(201).json({
        user : {
            email : user.email,
            name : user.name,
            id : user._id
        },
        token
    });

    await sendRegistrationEmail(user.email, user.name);
}
/**
 * -User login controller
 * /POST /api/auth/login
 */

async function userLoginController(req, res) {
    const {email , password} = req.body;

    const user = await userModel.findOne({email}).select('+password');
    if(!user){
        return res.status(401).json({
            message : 'Invalid credentials',
            status : 'failed'
        });
    }

    const isValidPasswrod = await user.comparePassword(password);
    if(!isValidPasswrod){
        return res.status(401).json({
            message : 'Email or password is incorrect',
            status : 'failed'
        });
    }

    const token = jwt.sign({userId : user._id}, process.env.JWT_SECRET, {expiresIn : '3d'});

    res.cookie('token', token);

    res.status(200).json({
        user : {
            id : user._id,
            email : user.email,
            name : user.name
        },
        token
    });
}

async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if(!token) {
        return res.status(200).json({
            message : 'Logged out successfully 1',
            status : 'success'
        });
    }

    await tokenBlacklistModel.create({ token });
    res.status(200).json({
        message : 'Logged out successfully',
        status : 'success'
    });
}


module.exports = {
    userRegisterUser ,
    userLoginController,
    userLogoutController
};

