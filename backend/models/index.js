const User = require("./User");
const Employee = require("./Employee");
const Attendance = require("./Attendance");
const Payment = require("./Payment");

// Define associations
Employee.hasMany(Attendance, {
  foreignKey: "employeeId",
  as: "attendances",
});

Attendance.belongsTo(Employee, {
  foreignKey: "employeeId",
  as: "employee",
});

Employee.hasMany(Payment, {
  foreignKey: "employeeId",
  as: "payments",
});

Payment.belongsTo(Employee, {
  foreignKey: "employeeId",
  as: "employee",
});

User.hasMany(Attendance, {
  foreignKey: "markedBy",
  as: "markedAttendances",
});

Attendance.belongsTo(User, {
  foreignKey: "markedBy",
  as: "marker",
});

module.exports = {
  User,
  Employee,
  Attendance,
  Payment,
};
