const express = require("express");
const {
  getAnalytics,
  exportPDF,
  exportCSV,
  getSalaryReport,
  exportSalaryPDF,
} = require("../controllers/reportController");

const router = express.Router();

const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/analytics", getAnalytics);
router.get("/export/pdf", exportPDF);
router.get("/export/csv", exportCSV);
router.get("/salary", getSalaryReport);
router.get("/salary/pdf", exportSalaryPDF);

module.exports = router;
