const express = require("express")
const { registerUser, loginUser, forgotPassword, resetPassword, verifyRegisterOtp } = require("../controllers/authController")
const { alreadyLoggin } = require("../middlewares/authMiddleware")

const router = express.Router();


router.get("/register", alreadyLoggin,  (req, res) => res.render("auth/register",{layout:false}));
router.post("/register", registerUser);

router.get('/verifyOtp', (req, res) => {
  const { phone, msg } = req.query;
  res.render('auth/verifyOtp', { layout: false, phone, message: msg || '', error: '' });
});
router.post("/verifyOtp", verifyRegisterOtp);

router.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    await sendSms(phone, `Your new OTP is: ${otp}`);

    res.json({ success: true });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});


router.get("/login", alreadyLoggin, (req, res) => res.render("auth/login", { layout:false}))
router.post("/login", loginUser)

router.get("/logout", (req,res) => {
    res.clearCookie("token")
    res.redirect('/auth/login')
})

router.get("/forgot", (req,res) => res.render("auth/forgot", { layout:false}));
router.post("/forgot", forgotPassword)

router.get("/reset/:token", (req, res) => res.render("auth/reset", { layout:false, token: req.params.token}));
router.post("/reset/:token", resetPassword)

module.exports = router;
