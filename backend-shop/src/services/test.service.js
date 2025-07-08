const db = require("../config/database");

class TestService {
  // Test function
  async test() {
    try {
      const [rows] = await db.execute("SELECT * from sanpham");
      return rows;
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("loi");
    }
  }
}
module.exports = new TestService();
