const express = require("express");
const {
  generatePayslip,
  exportPayslipPDF,
  generateYearlyPayslip,
} = require("../controllers/payslipController");

const router = express.Router();

const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/:employeeId", generatePayslip);
router.get("/:employeeId/pdf", exportPayslipPDF);
router.get("/:employeeId/yearly", generateYearlyPayslip);

module.exports = router;
