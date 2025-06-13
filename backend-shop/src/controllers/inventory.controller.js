const InventoryService = require("../services/inventory.service");

// Controller to update stock after approval
exports.updateStockAfterApproval = async (req, res) => {
  try {
    const { phieuNhapId } = req.params;
    await InventoryService.updateStockAfterApproval(phieuNhapId);
    res
      .status(200)
      .json({ message: "Stock updated successfully after approval." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
