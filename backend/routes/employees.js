const express = require("express");
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  importEmployees,
} = require("../controllers/employeeController");

const router = express.Router();

const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(protect);

router
  .route("/")
  .get(getEmployees)
  .post(upload.single("photo"), createEmployee);

router.get("/stats/dashboard", getEmployeeStats);

router.post("/import", upload.single("file"), importEmployees);

router
  .route("/:id")
  .get(getEmployee)
  .put(upload.single("photo"), updateEmployee)
  .delete(deleteEmployee);

module.exports = router;
