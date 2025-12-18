const express = require("express");
const router = express.Router();
const {
  addPayment,
  getPayments,
  getEmployeePayments,
  getPayment,
  updatePayment,
  deletePayment,
  getPaymentSummary,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/").post(addPayment).get(getPayments);

router.route("/:id").get(getPayment).put(updatePayment).delete(deletePayment);

router.get("/employee/:employeeId", getEmployeePayments);

router.get("/summary/:employeeId", getPaymentSummary);

module.exports = router;
