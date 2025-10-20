const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { User } = require("../models/User")
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const sendSms = require("../utils/smsService");
let otpStore = {};

const registerUser = async (req, res) => {
    try {

        const { name, email, phone, password, confirmPassword, role } = req.body

        // Empty fields
        if (!name || !email || !phone || !password || !confirmPassword || !role) {
            return res.status(400).render("auth/register", { error: "All fields are required" });
        }

        // Password match
        if (password !== confirmPassword) {
            return res.status(400).render("auth/register", { error: "Passwords do not match" });
        }

        // Password length
        if (password.length < 6) {
            return res.status(400).render("auth/register", { error: "Password must be at least 6 characters" });
        }

        // Phone validation
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).render("auth/register", { error: "Phone must be 10 digits" });
        }

        const existUser = await User.findOne({ email })
        if (existUser) {
            return res.status(400).render("auth/register", { error: "Email already exists" })
        }

        const hashed = await bcrypt.hash(password, 12)
        const newUser = await User.create({ name, email, phone, password: hashed, role, isVerified: false, })
        
        console.log(newUser);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 };
 // 5 min expiry

        await sendSms(phone, `Your OTP for registration is: ${otp}`);

        // ✅ Redirect to OTP verify page
        res.redirect(`/auth/verifyOtp?phone=${encodeURIComponent(phone)}&msg=${encodeURIComponent('OTP sent')}`);




    } catch (error) {

        console.log("Register Error:", error)
        res.status(500).render("auth/register", { error: "Server Error" , layout: false});
    }

}

const verifyRegisterOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    console.log("OTP verification attempt:", { phone, otp });

    if (!otpStore[phone]) {
      return res.render("auth/verifyOtp", { phone, error: "OTP expired or not sent." });
    }

    const { otp: storedOtp, expires } = otpStore[phone];

    if (Date.now() > expires) {
      delete otpStore[phone];
      return res.render("auth/verifyOtp", { phone, error: "OTP expired." });
    }

    if (String(storedOtp) !== String(otp)) {
      return res.render("auth/verifyOtp", { phone, error: "Invalid OTP." });
    }

    // ✅ OTP valid → update user
    await User.findOneAndUpdate({ phone }, { isVerified: true });

    delete otpStore[phone];

    res.redirect("/auth/login");
  } catch (err) {
    console.error("OTP Verify Error:", err);
    res.render("auth/verifyOtp", { phone: req.body.phone, error: "Server Error" , layout: false});
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existUser = await User.findOne({ email });

    if (!existUser) {
      return res.status(400).render("auth/login", { 
        error: "User not found", layout: false 
      });
    }

    const matchPass = await bcrypt.compare(password, existUser.password);
    if (!matchPass) {
      return res.status(400).render("auth/login", { 
        error: "Invalid password", layout: false 
      });
    }

    // 🔒 JWT token creation
    const token = jwt.sign(
      {
        id: existUser._id,
        name: existUser.name,
        role: existUser.role,
        email: existUser.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    // ✅ Role-based redirect with verification check
    switch (existUser.role) {
      case "superadmin":
        return res.redirect("/superadmin/dashboard");
      case "admin":
        if (!existUser.verified) {
          // show waiting page
          return res.redirect("/admin/pending");
        }
        return res.redirect("/admin/dashboard");
      case "worker":
        return res.redirect("/worker/dashboard");
      case "customer":
        return res.redirect("/customer/dashboard");
      default:
        return res.redirect("/auth/login");
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).render("auth/login", { 
      error: "Server error, please try again", layout: false 
    });
  }
};


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email })

        if (!user) return res.render("auth/forgot", { error: "User not Found", layout: false });

        // reset token
        const token = crypto.randomBytes(32).toString("hex")
        user.resetToken = token;
        user.resetTokenExpire = Date.now() + 15 * 60 * 1000;
        await user.save();

        // send mail
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetURL = `http://localhost:5000/auth/reset/${token}`;
        const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; background-color: #151821; border-radius: 12px; border: 1px solid #232735; overflow: hidden;">
            <div style="padding: 20px 30px; background-color: #1a1d24; text-align: center;">
                <h1 style="color: #16da64; font-weight: bold; margin: 0;">Servizo</h1>
            </div>
            <div style="padding: 30px;">
                <h2 style="color: #e8ecf4; margin-top: 0;">Password Reset Request</h2>
                <p style="color: #9aa3b2; line-height: 1.6;">Hello ${user.name},</p>
                <p style="color: #9aa3b2; line-height: 1.6;">
                    We received a request to reset the password for your account. Please click the button below to set a new password. This link is valid for 15 minutes.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetURL}" style="background-color: #16da64; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Reset Your Password
                    </a>
                </div>
                <p style="color: #9aa3b2; line-height: 1.6;">
                    If you did not request a password reset, please ignore this email or contact support if you have concerns.
                </p>
                <p style="color: #9aa3b2; line-height: 1.6;">Thanks,<br>The Servizo Team</p>
            </div>
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #4b5563; border-top: 1px solid #232735;">
                &copy; ${new Date().getFullYear()} Servizo. All rights reserved.
            </div>
        </div>
      `;

        await transporter.sendMail({
            from: `"Servizo" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "Password Reset",
            html: emailHtml,
        });

        res.render("auth/forgot", { success: "Password reset email sent!" , layout: false});

    } catch (error) {
        console.error(error);
        res.render("auth/forgot", { error: "Something went wrong!" , layout: false});
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;


        const user = await User.findOne({
            resetToken: token,
            resetTokenExpire: { $gt: Date.now() },
        });

        if (!user) return res.render("auth/reset", { error: "Invalid or expired token!", token });

        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpire = undefined;

        await user.save();

        res.redirect("/auth/login");

    } catch (error) {
        console.error(error);
        res.render("auth/reset", { error: "Something went wrong!", token, layout: false});
    }
}




module.exports = {
    registerUser,
    verifyRegisterOtp,
    loginUser,
    forgotPassword,
    resetPassword
}