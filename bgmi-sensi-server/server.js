require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

console.log(`key id: ${process.env.RAZORPAY_KEY_ID}, key secret: ${process.env.RAZORPAY_KEY_SECRET}`)

// Initialize Razorpay instance
/*const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});*/

// root page 
app.get("/",(req, res)=>{
    res.sendFile(path.join(__dirname, "../bgmi-sensi-client/temp.html"))
})

//terms and conditions 
app.get("/t&c",(req, res)=>{
    res.sendFile(path.join(__dirname, "../bgmi-sensi-client/policy.html"))
})

// 🟢 Route 1: Create a Razorpay Payment Order
app.post("/payment", async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const options = {
      amount: amount * 100, // Razorpay expects amount in paisa
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, orderId: order.id, amount: order.amount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Payment initiation failed", error });
  }
});

// 🟢 Route 2: Verify Razorpay Payment Signature
app.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Create HMAC SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Payment verified successfully
    res.json({ success: true, message: "Payment verified", transactionId: razorpay_payment_id });
  } catch (error) {
    res.status(500).json({ success: false, message: "Payment verification failed", error });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
