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
//forgotPassword
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
    // Get user based on POSTed email
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorHandler('Không tìm thấy người dùng với email này', 404));
    }

    // Generate random reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    // const resetURL = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`;
    const resetURL = `${req.protocol}://${process.env.FRONTEND_URL}/reset?token=${resetToken}`;

    const message = `Bạn nhận được email này vì bạn (hoặc ai đó khác) đã yêu cầu đặt lại mật khẩu tài khoản của bạn.\n\n
    Hãy nhấp vào liên kết sau để đặt lại mật khẩu của bạn:\n\n
    ${resetURL}\n\n
    Nếu bạn không yêu cầu yêu cầu đặt lại mật khẩu này, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.\n`;


    try {
        // Create transport
        const transport = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        })

        // Send email
        await transport.sendMail({
            from: {
                name: process.env.SMTP_FROM_NAME,
                address: process.env.SMTP_FROM_EMAIL
            },
            to: user.email,
            subject: 'Yêu cầu đặt lại mật khẩu của bạn',
            text: message,
        });

        res.status(200).json({
            success: true,
            message: `Đường dẫn đặt lại mật khẩu đã được gửi đến email ${user.email}`,
            token: resetToken
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler('Đã có lỗi xảy ra khi gửi email đặt lại mật khẩu. Vui lòng thử lại sau.', 500));
    }
});

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
    // Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    // console.log(req.params.token);
    // console.log(hashedToken);
    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ErrorHandler('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 400));
    }

    // Update user password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    sendToken(user, 200, res);
});

// Register a user   => /api/v1/register
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

// Logout user   =>   /api/v1/logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: 'Đã đăng xuất'
    })
})
