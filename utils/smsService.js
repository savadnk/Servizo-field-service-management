const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSms = async (to, message) => {
  try {
    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: `+91${to}`   // ✅ correct usage
    });
    console.log("SMS sent:", sms.sid);
  } catch (error) {
    console.error("SMS Error:", error);
  }
};


module.exports = sendSms;
