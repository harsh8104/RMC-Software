const { Employee, Attendance, Payment } = require("../models");
const { Op } = require("sequelize");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

// @desc    Generate payslip for an employee
// @route   GET /api/payslip/:employeeId
// @access  Private
exports.generatePayslip = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Please provide month and year",
      });
    }

    // Get employee details
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get attendance records for the month
    const attendance = await Attendance.findAll({
      where: {
        employeeId: employeeId,
        date: { [Op.between]: [startDate, endDate] },
      },
    });

    // Calculate attendance summary
    const totalDays = endDate.getDate();
    const presentDays = attendance.filter((a) => a.status === "present").length;
    const halfDays = attendance.filter((a) => a.status === "half-day").length;
    const absentDays = attendance.filter((a) => a.status === "absent").length;
    const paidLeaveDays = attendance.filter(
      (a) => a.status === "paid-leave"
    ).length;

    // Working days = Total days in month (including all days)
    const workingDays = totalDays;

    // Calculate effective working days (paid leave counts as full day present)
    const effectiveWorkingDays = presentDays + paidLeaveDays + halfDays * 0.5;

    // Calculate salary
    const perDaySalary = employee.currentSalary / workingDays;
    const earnedSalary = perDaySalary * effectiveWorkingDays;
    const bonusAmount = parseFloat(employee.bonus) || 0;
    const totalEarnings = earnedSalary + bonusAmount;

    // Deductions
    const absentDeduction = perDaySalary * absentDays;
    const halfDayDeduction = perDaySalary * halfDays * 0.5;
    const totalDeductions = absentDeduction + halfDayDeduction;

    // Net salary (before payments)
    const netSalary = totalEarnings - totalDeductions;

    // Get payments made for this month
    const payments = await Payment.findAll({
      where: {
        employeeId: employeeId,
        month: month,
        year: year,
      },
      order: [["paymentDate", "ASC"]],
    });

    const totalPaid = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount),
      0
    );

    const pendingBalance = netSalary - totalPaid;

    // Payslip data
    const payslipData = {
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.fullName,
        aadhar: employee.aadharNumber,
        type: employee.type,
        address: employee.address,
      },
      period: {
        month: new Date(year, month - 1).toLocaleString("default", {
          month: "long",
        }),
        year: year,
        totalDays,
        workingDays,
      },
      attendance: {
        present: presentDays,
        halfDay: halfDays,
        absent: absentDays,
        paidLeave: paidLeaveDays,
        effectiveWorkingDays: effectiveWorkingDays.toFixed(2),
      },
      salary: {
        basic: employee.currentSalary,
        perDay: perDaySalary.toFixed(2),
        earned: earnedSalary.toFixed(2),
        bonus: bonusAmount,
        totalEarnings: totalEarnings.toFixed(2),
      },
      deductions: {
        absent: absentDeduction.toFixed(2),
        halfDay: halfDayDeduction.toFixed(2),
        total: totalDeductions.toFixed(2),
      },
      netSalary: netSalary.toFixed(2),
      payments: payments.map((p) => ({
        id: p.id,
        amount: parseFloat(p.amount).toFixed(2),
        date: p.paymentDate,
        remarks: p.remarks,
      })),
      totalPaid: totalPaid.toFixed(2),
      pendingBalance: pendingBalance.toFixed(2),
      generatedDate: new Date().toLocaleDateString(),
    };

    res.status(200).json({
      success: true,
      data: payslipData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export payslip as PDF
// @route   GET /api/payslip/:employeeId/pdf
// @access  Private
exports.exportPayslipPDF = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Please provide month and year",
      });
    }

    // Get employee details
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Calculate date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get attendance records
    const attendance = await Attendance.findAll({
      where: {
        employeeId: employeeId,
        date: { [Op.between]: [startDate, endDate] },
      },
    });

    // Calculate all values (same as above)
    const totalDays = endDate.getDate();
    const presentDays = attendance.filter((a) => a.status === "present").length;
    const halfDays = attendance.filter((a) => a.status === "half-day").length;
    const absentDays = attendance.filter((a) => a.status === "absent").length;
    const paidLeaveDays = attendance.filter(
      (a) => a.status === "paid-leave"
    ).length;

    // Working days = Total days in month (including all days)
    const workingDays = totalDays;

    const effectiveWorkingDays = presentDays + paidLeaveDays + halfDays * 0.5;
    const perDaySalary = employee.currentSalary / workingDays;
    const earnedSalary = perDaySalary * effectiveWorkingDays;
    const bonusAmount = parseFloat(employee.bonus) || 0;
    const totalEarnings = earnedSalary + bonusAmount;
    const absentDeduction = perDaySalary * absentDays;
    const halfDayDeduction = perDaySalary * halfDays * 0.5;
    const totalDeductions = absentDeduction + halfDayDeduction;
    const netSalary = totalEarnings - totalDeductions;

    // Get payments made for this month
    const payments = await Payment.findAll({
      where: {
        employeeId: employeeId,
        month: month,
        year: year,
      },
      order: [["paymentDate", "ASC"]],
    });

    const totalPaid = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount),
      0
    );

    const pendingBalance = netSalary - totalPaid;

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payslip-${employee.fullName.replace(
        / /g,
        "-"
      )}-${month}-${year}.pdf`
    );

    doc.pipe(res);

    // Header with border and logo
    doc.rect(30, 30, 535, 90).stroke();

    // Add logo if it exists
    const logoPath = path.join(__dirname, "../../frontend/public/logo.png");
    const fs = require("fs");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 40, { width: 60, height: 60 });
    }

    doc
      .fontSize(28)
      .fillColor("#FF6347")
      .font("Helvetica-Bold")
      .text("Vasudevnarayan RMC Infra", 30, 45, {
        align: "center",
        width: 535,
      });

    doc
      .fontSize(16)
      .fillColor("#000000")
      .font("Helvetica-Bold")
      .text("SALARY SLIP", 30, 78, { align: "center", width: 535 });

    // Period
    const monthName = new Date(year, month - 1).toLocaleString("default", {
      month: "long",
    });
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#666666")
      .text(`Period: ${monthName} ${year}`, 30, 100, {
        align: "center",
        width: 535,
      })
      .moveDown(1);

    // Employee Details Section
    doc
      .fontSize(13)
      .fillColor("#FF6347")
      .font("Helvetica-Bold")
      .text("Employee Details", 50, doc.y, { underline: true })
      .moveDown(0.3);

    const leftColumn = 50;
    const valueColumn = 200;
    let y = doc.y;

    doc.fontSize(10).fillColor("#000000").font("Helvetica");

    const employeeDetails = [
      { label: "Employee Name:", value: employee.fullName },
      {
        label: "Employee ID:",
        value: employee.employeeId,
      },
      { label: "Aadhar Number:", value: employee.aadharNumber },
      { label: "Designation:", value: employee.type.toUpperCase() },
      { label: "Address:", value: employee.address },
    ];

    employeeDetails.forEach((detail) => {
      doc.font("Helvetica").text(detail.label, leftColumn, y, { width: 140 });
      doc
        .font("Helvetica-Bold")
        .text(detail.value, valueColumn, y, { width: 300 });
      y += 15;
    });

    y += 8;

    // Attendance Summary Section
    doc
      .fontSize(13)
      .fillColor("#FF6347")
      .font("Helvetica-Bold")
      .text("Attendance Summary", leftColumn, y, { underline: true })
      .moveDown(0.3);

    y = doc.y;
    doc.fontSize(10).fillColor("#000000");

    const attendanceData = [
      { label: "Total Days in Month:", value: totalDays.toString() },
      { label: "Working Days:", value: workingDays.toString() },
      { label: "Days Present:", value: presentDays.toString() },
      { label: "Half Days:", value: halfDays.toString() },
      { label: "Days Absent:", value: absentDays.toString() },
      { label: "Paid Leave Days:", value: paidLeaveDays.toString() },
      {
        label: "Effective Working Days:",
        value: effectiveWorkingDays.toFixed(2),
      },
    ];

    attendanceData.forEach((item) => {
      doc.font("Helvetica").text(item.label, leftColumn, y, { width: 140 });
      doc.font("Helvetica-Bold").text(item.value, valueColumn, y);
      y += 15;
    });

    y += 8;

    // Salary Breakdown Section
    doc
      .fontSize(13)
      .fillColor("#FF6347")
      .font("Helvetica-Bold")
      .text("Salary Breakdown", leftColumn, y, { underline: true })
      .moveDown(0.3);

    y = doc.y;

    // Earnings Table
    doc.rect(leftColumn - 5, y, 505, 22).fillAndStroke("#FF6347", "#FF6347");

    doc
      .fontSize(11)
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .text("EARNINGS", leftColumn, y + 6)
      .text("AMOUNT ₹", 420, y + 6, { width: 130, align: "right" });

    y += 25;
    doc.fillColor("#000000").font("Helvetica").fontSize(10);

    const earningsData = [
      {
        label: "Basic Salary (Monthly):",
        value: parseFloat(employee.currentSalary).toFixed(2),
      },
      { label: "Per Day Salary:", value: perDaySalary.toFixed(2) },
      { label: "Earned Salary:", value: earnedSalary.toFixed(2) },
    ];

    if (bonusAmount > 0) {
      earningsData.push({ label: "Bonus:", value: bonusAmount.toFixed(2) });
    }

    earningsData.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? "#F9FAFB" : "#FFFFFF";
      doc.rect(leftColumn - 5, y - 2, 505, 20).fill(bgColor);
      doc
        .fillColor("#000000")
        .font("Helvetica")
        .fontSize(10)
        .text(item.label, leftColumn, y);
      doc
        .font("Helvetica-Bold")
        .text(item.value, 420, y, { width: 130, align: "right" });
      y += 20;
    });

    y += 5;
    doc.rect(leftColumn - 5, y - 2, 505, 22).fill("#FFE8E1");
    doc
      .fontSize(11)
      .fillColor("#000000")
      .font("Helvetica-Bold")
      .text("Total Earnings:", leftColumn, y + 3)
      .text(totalEarnings.toFixed(2), 420, y + 3, {
        width: 130,
        align: "right",
      });

    y += 22;

    // Deductions Table
    doc.rect(leftColumn - 5, y, 505, 22).fillAndStroke("#DC2626", "#DC2626");

    doc
      .fontSize(11)
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .text("DEDUCTIONS", leftColumn, y + 6)
      .text("AMOUNT ₹", 420, y + 6, { width: 130, align: "right" });

    y += 25;
    doc.fillColor("#000000").font("Helvetica").fontSize(10);

    const deductionsData = [
      { label: "Absent Days Deduction:", value: absentDeduction.toFixed(2) },
      { label: "Half Day Deduction:", value: halfDayDeduction.toFixed(2) },
    ];

    deductionsData.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? "#FEF2F2" : "#FFFFFF";
      doc.rect(leftColumn - 5, y - 2, 505, 20).fill(bgColor);
      doc
        .fillColor("#000000")
        .font("Helvetica")
        .fontSize(10)
        .text(item.label, leftColumn, y);
      doc
        .font("Helvetica-Bold")
        .text(item.value, 420, y, { width: 130, align: "right" });
      y += 20;
    });

    y += 5;
    doc.rect(leftColumn - 5, y - 2, 505, 22).fill("#E0E0E0");
    doc
      .fontSize(11)
      .fillColor("#000000")
      .font("Helvetica-Bold")
      .text("Total Deductions:", leftColumn, y + 3)
      .text(totalDeductions.toFixed(2), 420, y + 3, {
        width: 130,
        align: "right",
      });

    y += 22;

    // Payments Made Section (if any payments exist)
    if (payments.length > 0) {
      doc.rect(leftColumn - 5, y, 505, 22).fillAndStroke("#3B82F6", "#3B82F6");

      doc
        .fontSize(11)
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .text("PAYMENTS MADE", leftColumn, y + 6)
        .text("AMOUNT ₹", 420, y + 6, { width: 130, align: "right" });

      y += 25;
      doc.fillColor("#000000").font("Helvetica").fontSize(10);

      payments.forEach((payment, index) => {
        const bgColor = index % 2 === 0 ? "#EFF6FF" : "#FFFFFF";
        doc.rect(leftColumn - 5, y - 2, 505, 20).fill(bgColor);

        const paymentDate = new Date(payment.paymentDate).toLocaleDateString(
          "en-IN",
          { day: "2-digit", month: "short", year: "numeric" }
        );
        const label = payment.remarks
          ? `${paymentDate} - ${payment.remarks}`
          : paymentDate;

        doc
          .fillColor("#000000")
          .font("Helvetica")
          .fontSize(10)
          .text(label, leftColumn, y);
        doc
          .font("Helvetica-Bold")
          .text(parseFloat(payment.amount).toFixed(2), 420, y, {
            width: 130,
            align: "right",
          });
        y += 20;
      });

      y += 5;
      doc.rect(leftColumn - 5, y - 2, 505, 22).fill("#DBEAFE");
      doc
        .fontSize(11)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text("Total Paid:", leftColumn, y + 3)
        .text(totalPaid.toFixed(2), 420, y + 3, {
          width: 130,
          align: "right",
        });

      y += 22;
    }

    // Gross Salary Box
    doc
      .rect(leftColumn - 5, y, 505, 35)
      .fillAndStroke("#22C55E", "#16A34A")
      .lineWidth(2);

    doc
      .fontSize(15)
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .text("GROSS SALARY:", leftColumn + 5, y + 10);
    doc.fontSize(16).text(netSalary.toFixed(2), 380, y + 9, {
      width: 120,
      align: "right",
    });
    y += 40;

    // Pending Balance Box (if payments made)
    if (payments.length > 0) {
      doc
        .rect(leftColumn - 5, y, 505, 35)
        .fillAndStroke("#FF6347", "#DC2626")
        .lineWidth(2);

      doc
        .fontSize(15)
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .text("PENDING BALANCE:", leftColumn + 5, y + 10);
      doc.fontSize(16).text(pendingBalance.toFixed(2), 380, y + 9, {
        width: 120,
        align: "right",
      });
      y += 40;
    }

    y += 5;

    // Footer
    doc
      .fontSize(9)
      .fillColor("#666666")
      .font("Helvetica")
      .text(
        `Generated on: ${new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })} at ${new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}`,
        leftColumn,
        y,
        { align: "center", width: 505 }
      );

    y += 15;

    doc
      .fontSize(8)
      .fillColor("#999999")
      .text(
        "This is a computer-generated document. No signature is required.",
        leftColumn,
        y,
        { align: "center", width: 505 }
      );

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Generate yearly payslip summary
// @route   GET /api/payslip/:employeeId/yearly
// @access  Private
exports.generateYearlyPayslip = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: "Please provide year",
      });
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const monthlyData = [];
    let yearlyTotal = 0;

    // Calculate for each month
    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const attendance = await Attendance.findAll({
        where: {
          employeeId: employeeId,
          date: { [Op.between]: [startDate, endDate] },
        },
      });

      const totalDays = endDate.getDate();
      const presentDays = attendance.filter(
        (a) => a.status === "present"
      ).length;
      const halfDays = attendance.filter((a) => a.status === "half-day").length;
      const absentDays = attendance.filter((a) => a.status === "absent").length;

      // Working days = Total days in month (including all days)
      const workingDays = totalDays;

      const effectiveWorkingDays = presentDays + halfDays * 0.5;
      const perDaySalary = employee.currentSalary / workingDays;
      const earnedSalary = perDaySalary * effectiveWorkingDays;
      const bonusAmount = parseFloat(employee.bonus) || 0;
      const totalEarnings = earnedSalary + bonusAmount;
      const absentDeduction = perDaySalary * absentDays;
      const halfDayDeduction = perDaySalary * halfDays * 0.5;
      const totalDeductions = absentDeduction + halfDayDeduction;
      const netSalary = totalEarnings - totalDeductions;

      // Get payments for this month
      const payments = await Payment.findAll({
        where: {
          employeeId: employeeId,
          month: month,
          year: year,
        },
      });

      const totalPaid = payments.reduce(
        (sum, payment) => sum + parseFloat(payment.amount),
        0
      );

      const pendingBalance = netSalary - totalPaid;

      yearlyTotal += pendingBalance;

      monthlyData.push({
        month: new Date(year, month - 1).toLocaleString("default", {
          month: "long",
        }),
        present: presentDays,
        absent: absentDays,
        halfDay: halfDays,
        netSalary: netSalary.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        pendingBalance: pendingBalance.toFixed(2),
      });
    }

    res.status(200).json({
      success: true,
      data: {
        employee: {
          name: employee.fullName,
          aadhar: employee.aadharNumber,
          type: employee.type,
        },
        year,
        monthlyData,
        yearlyTotal: yearlyTotal.toFixed(2),
      },
    });
  } catch (error) {
    next(error);
  }
};
