const express = require("express");
const {
  getAttendance,
  markAttendance,
  bulkMarkAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployeeAttendanceSummary,
  getRecentActivity,
} = require("../controllers/attendanceController");

const router = express.Router();

const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/").get(getAttendance);

router.post("/mark", markAttendance);
router.post("/bulk-mark", bulkMarkAttendance);
router.get("/recent", getRecentActivity);
router.get("/summary/:employeeId", getEmployeeAttendanceSummary);

router.route("/:id").put(updateAttendance).delete(deleteAttendance);

module.exports = router;
