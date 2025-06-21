const testVoucherData = {
  Ten: "Giảm giá mùa hè",
  MoTa: "Voucher giảm giá 20% cho mùa hè",
  PhanTramGiam: 20,
  GiaTriGiamToiDa: 200000,
  DieuKienApDung: 500000,
  SoLuotSuDung: 100,
  NgayBatDau: "2025-06-18",
  NgayKetThuc: "2025-08-31",
};

async function testCreateVoucher() {
  try {
    console.log("🧪 Testing Create Voucher API...");
    console.log("📝 Voucher Data:", JSON.stringify(testVoucherData, null, 2));

    const response = await fetch("http://localhost:5000/api/vouchers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add your session cookie here if needed
        Cookie:
          "connect.sid=s%3AUdcby177L7E26kJHO1OAhaqTgj4C7DVk.Wpwhmwzdvz11AzRlvbUTAhfTnXbW1uFj3Dv8ylC3ZPc",
      },
      body: JSON.stringify(testVoucherData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ SUCCESS: Voucher created successfully!");
      console.log("📄 Response:", JSON.stringify(result, null, 2));
    } else {
      console.log("❌ ERROR: Failed to create voucher");
      console.log("📄 Error Response:", JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("🚨 Network Error:", error.message);
  }
}

async function testGetVouchers() {
  try {
    console.log("\n🧪 Testing Get Vouchers API...");

    const response = await fetch("http://localhost:5000/api/vouchers", {
      method: "GET",
      headers: {
        Cookie:
          "connect.sid=s%3AUdcby177L7E26kJHO1OAhaqTgj4C7DVk.Wpwhmwzdvz11AzRlvbUTAhfTnXbW1uFj3Dv8ylC3ZPc",
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ SUCCESS: Got vouchers list!");
      console.log("📊 Total Vouchers:", result.data?.length || "Unknown");
      console.log("📄 Response:", JSON.stringify(result, null, 2));
    } else {
      console.log("❌ ERROR: Failed to get vouchers");
      console.log("📄 Error Response:", JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("🚨 Network Error:", error.message);
  }
}

// Run tests
async function runTests() {
  console.log("🚀 Starting Voucher API Tests...\n");

  // Test create voucher
  await testCreateVoucher();

  // Wait a bit then test get vouchers
  setTimeout(async () => {
    await testGetVouchers();
  }, 1000);
}

runTests();
