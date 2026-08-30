const Razorpay = require("razorpay");

console.log("RAZORPAY KEY:", process.env.RAZORPAY_KEY_ID);
console.log(
  "SECRET EXISTS:",
  !!process.env.RAZORPAY_KEY_SECRET
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (amount) => {
  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);

  return order;
};

module.exports = {
  razorpay,
  createOrder,
};