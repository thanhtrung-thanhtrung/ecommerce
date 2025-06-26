const fetch = require("node-fetch");

async function checkBackend() {
  const BACKEND_URL = "http://localhost:5000";

  console.log("🔍 Checking backend server...");

  try {
    // Test basic connection
    const response = await fetch(`${BACKEND_URL}/api`);

    if (response.ok) {
      console.log("✅ Backend server is running on port 5000");

      // Test specific cart endpoint
      try {
        const cartResponse = await fetch(`${BACKEND_URL}/api/cart`, {
          headers: {
            "Content-Type": "application/json",
            "X-Session-ID": "test-session",
          },
        });

        if (cartResponse.ok) {
          console.log("✅ Cart API endpoint is working");
        } else {
          console.log("⚠️ Cart API endpoint returned:", cartResponse.status);
        }
      } catch (cartError) {
        console.log("❌ Cart API endpoint failed:", cartError.message);
      }
    } else {
      console.log("❌ Backend server responded with status:", response.status);
    }
  } catch (error) {
    console.log("❌ Backend server is not running or not accessible");
    console.log("Error:", error.message);
    console.log("\n📝 To fix this:");
    console.log("1. Navigate to backend-shop directory: cd ../backend-shop");
    console.log("2. Install dependencies: npm install");
    console.log("3. Start the server: npm start or npm run dev");
    console.log("4. Make sure it runs on port 5000");
  }
}

checkBackend();
