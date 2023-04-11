const User = require('../models/user');

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const sendToken = require('../utils/jwtToken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cloudinary = require('cloudinary');

exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    // Checks if email and password is entered by user
    if (!email || !password) {
        return next(new ErrorHandler('Email và Mật khẩu không được để trống', 400))
    }

    // Finding user in database
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
        return next(new ErrorHandler('Email không tồn tại', 401));
    }

    // Checks if password is correct or not
    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler('Mật khẩu không đúng', 401));
    }

    sendToken(user, 200, res)
})

exports.registerUser = catchAsyncErrors(async (req, res, next) => {

    const { name, email, password, avatar } = req.body;

    if (!name) {
        return next(new ErrorHandler('Tên không được để trống', 401))
    }
    if (!email) {
        return next(new ErrorHandler('Email không được để trống', 401))
    }
    if (!password) {
        return next(new ErrorHandler('Mật khẩu không được để trống', 401))
    }
    if (!avatar) {
        return next(new ErrorHandler('Hình đại diện không được để trống', 401))
    }

    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: 'avatars',
        width: 150,
        crop: "scale"
    })


    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: result.public_id,
            url: result.secure_url
        }
    })

    sendToken(user, 200, res)

})