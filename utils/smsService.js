// const twilio = require("twilio");

// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// const sendSms = async (to, message) => {
//   try {
//     const sms = await client.messages.create({
//       body: message,
//       from: process.env.TWILIO_PHONE,
//       to: `+91${to}`   // ✅ correct usage
//     });
//     console.log("SMS sent:", sms.sid);
//   } catch (error) {
//     console.error("SMS Error:", error);
//   }
// };


// module.exports = sendSms;

const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSms = async (to, message) => {
  try {
    // Ensure E.164 format
    if (!to.startsWith("+")) {
      throw new Error(`Phone number must be in E.164 format, got: ${to}`);
    }

    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to
    });

    console.log(`✅ SMS sent to ${to}: SID ${sms.sid}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${to}:`, error.message);
    return false;
  }
};

module.exports = sendSms;
