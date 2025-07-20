const crypto = require("crypto");

const vnp_HashSecret = "27TBCDYVROCTIFL2X5M4IF7NM8IGWINX";

// Dữ liệu IPN giả lập đúng với đơn hàng thật từ DB
const ipnData = {
  vnp_Amount: "80000000", // 800,000 x 100
  vnp_BankCode: "NCB",
  vnp_BankTranNo: "VNP14670036",
  vnp_CardType: "ATM",
  vnp_OrderInfo: "Thanh toan don hang DH250718-77",
  vnp_PayDate: "20250719163609",
  vnp_ResponseCode: "00",
  vnp_TmnCode: "46OBP8RP",
  vnp_TransactionNo: "14670036",
  vnp_TransactionStatus: "00",
  vnp_TxnRef: "DH250718-77",
  vnp_SecureHashType: "SHA512",
};

// Bước 1: Sắp xếp keys theo alphabet
const sortedKeys = Object.keys(ipnData)
  .filter((key) => key !== "vnp_SecureHash" && key !== "vnp_SecureHashType")
  .sort();

const signData = sortedKeys.map((key) => `${key}=${ipnData[key]}`).join("&");

console.log("Sign Data:", signData);

// Bước 2: Tạo chữ ký HMAC SHA512
const hmac = crypto.createHmac("sha512", vnp_HashSecret);
const signature = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

console.log("Generated Signature:", signature);

// Bước 3: In ra curl để test
console.log("\n✅ CURL COMMAND:");
console.log(`curl -X POST http://localhost:5000/api/payments/vnpay/ipn \\
  -H "Content-Type: application/json" \\
  -d '{
    "vnp_Amount": "${ipnData.vnp_Amount}",
    "vnp_BankCode": "${ipnData.vnp_BankCode}",
    "vnp_BankTranNo": "${ipnData.vnp_BankTranNo}",
    "vnp_CardType": "${ipnData.vnp_CardType}",
    "vnp_OrderInfo": "${ipnData.vnp_OrderInfo}",
    "vnp_PayDate": "${ipnData.vnp_PayDate}",
    "vnp_ResponseCode": "${ipnData.vnp_ResponseCode}",
    "vnp_TmnCode": "${ipnData.vnp_TmnCode}",
    "vnp_TransactionNo": "${ipnData.vnp_TransactionNo}",
    "vnp_TransactionStatus": "${ipnData.vnp_TransactionStatus}",
    "vnp_TxnRef": "${ipnData.vnp_TxnRef}",
    "vnp_SecureHashType": "${ipnData.vnp_SecureHashType}",
    "vnp_SecureHash": "${signature}"
}'`);
