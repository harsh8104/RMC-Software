const { Attendance, Employee, User } = require("../models");
const { Op } = require("sequelize");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// @desc    Get attendance analytics
// @route   GET /api/reports/analytics
// @access  Private
exports.getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate && endDate) {
        where.date[Op.between] = [new Date(startDate), new Date(endDate)];
      } else if (startDate) {
        where.date[Op.gte] = new Date(startDate);
      } else if (endDate) {
        where.date[Op.lte] = new Date(endDate);
      }
    }

    const totalEmployees = await Employee.count({
      where: { status: "active" },
    });
    const attendance = await Attendance.findAll({ where });

    const analytics = {
      totalRecords: attendance.length,
      present: attendance.filter((a) => a.status === "present").length,
      absent: attendance.filter((a) => a.status === "absent").length,
      halfDay: attendance.filter((a) => a.status === "half-day").length,
      paidLeave: attendance.filter((a) => a.status === "paid-leave").length,
      totalEmployees,
    };

    analytics.presentPercentage =
      analytics.totalRecords > 0
        ? (
            ((analytics.present +
              analytics.paidLeave +
              analytics.halfDay * 0.5) /
              analytics.totalRecords) *
            100
          ).toFixed(2)
        : 0;

    // Get daily breakdown
    const dailyBreakdown = {};
    attendance.forEach((record) => {
      // Handle DATEONLY type from Sequelize (already a string in YYYY-MM-DD format)
      const dateKey =
        typeof record.date === "string"
          ? record.date
          : new Date(record.date).toISOString().split("T")[0];
      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = {
          present: 0,
          absent: 0,
          halfDay: 0,
          paidLeave: 0,
        };
      }
      dailyBreakdown[dateKey][
        record.status === "half-day"
          ? "halfDay"
          : record.status === "paid-leave"
          ? "paidLeave"
          : record.status
      ]++;
    });

    res.status(200).json({
      success: true,
      data: {
        overview: analytics,
        dailyBreakdown: Object.entries(dailyBreakdown).map(([date, stats]) => ({
          date,
          ...stats,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export attendance report as PDF
// @route   GET /api/reports/export/pdf
// @access  Private
exports.exportPDF = async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate, reportType } = req.query;

    let where = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate && endDate) {
        where.date[Op.between] = [new Date(startDate), new Date(endDate)];
      } else if (startDate) {
        where.date[Op.gte] = new Date(startDate);
      } else if (endDate) {
        where.date[Op.lte] = new Date(endDate);
      }
    }

    const attendance = await Attendance.findAll({
      where,
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["fullName", "aadharNumber", "type", "currentSalary"],
        },
      ],
      order: [["date", "ASC"]],
    });

    if (attendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for the specified criteria",
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance-report-${Date.now()}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add company header with logo
    const logoPath = path.join(__dirname, "../../frontend/public/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 50, { width: 60, height: 60 });
    }

    doc
      .fontSize(24)
      .fillColor("#FF6347")
      .text("Vasudevnarayan RMC Infra", { align: "center" });

    doc
      .fontSize(12)
      .fillColor("#000000")
      .text("Attendance Report", { align: "center" })
      .moveDown();

    // Report details
    doc.fontSize(10);
    if (startDate)
      doc.text(`From: ${new Date(startDate).toLocaleDateString()}`);
    if (endDate) doc.text(`To: ${new Date(endDate).toLocaleDateString()}`);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    if (employeeId) {
      // Single employee report
      const employee = attendance[0].employee;

      doc
        .fontSize(14)
        .fillColor("#FF6347")
        .text("Employee Details", { underline: true })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor("#000000")
        .text(`Name: ${employee.fullName}`)
        .text(`Aadhar: ${employee.aadharNumber}`)
        .text(`Type: ${employee.type}`)
        .text(`Salary: Rs. ${employee.currentSalary}`)
        .moveDown();

      // Summary
      const summary = {
        total: attendance.length,
        present: attendance.filter((a) => a.status === "present").length,
        absent: attendance.filter((a) => a.status === "absent").length,
        halfDay: attendance.filter((a) => a.status === "half-day").length,
        paidLeave: attendance.filter((a) => a.status === "paid-leave").length,
      };

      doc
        .fontSize(12)
        .fillColor("#FF6347")
        .text("Summary", { underline: true })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor("#000000")
        .text(`Total Days: ${summary.total}`)
        .text(`Present: ${summary.present}`)
        .text(`Absent: ${summary.absent}`)
        .text(`Half Day: ${summary.halfDay}`)
        .text(`Paid Leave: ${summary.paidLeave}`)
        .text(
          `Attendance %: ${(
            ((summary.present + summary.paidLeave + summary.halfDay * 0.5) /
              summary.total) *
            100
          ).toFixed(2)}%`
        )
        .moveDown();

      // Attendance records table
      doc
        .fontSize(12)
        .fillColor("#FF6347")
        .text("Attendance Records", { underline: true })
        .moveDown(0.5);

      doc.fontSize(9);
      let y = doc.y;

      // Table header
      doc
        .fillColor("#000000")
        .text("Date", 50, y, { width: 100 })
        .text("Status", 180, y, { width: 100 })
        .text("Note", 300, y, { width: 200 });

      y += 20;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      // Table rows
      attendance.forEach((record) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc
          .text(new Date(record.date).toLocaleDateString(), 50, y, {
            width: 100,
          })
          .text(record.status, 180, y, { width: 100 })
          .text(record.note || "-", 300, y, { width: 200 });

        y += 20;
      });
    } else {
      // All employees report
      const employeeMap = {};

      attendance.forEach((record) => {
        const empId = record.employee.id;
        if (!employeeMap[empId]) {
          employeeMap[empId] = {
            employee: record.employee,
            records: [],
            summary: { present: 0, absent: 0, halfDay: 0, paidLeave: 0 },
          };
        }
        employeeMap[empId].records.push(record);
        employeeMap[empId].summary[
          record.status === "half-day"
            ? "halfDay"
            : record.status === "paid-leave"
            ? "paidLeave"
            : record.status
        ]++;
      });

      doc
        .fontSize(12)
        .fillColor("#FF6347")
        .text("Summary by Employee", { underline: true })
        .moveDown(0.5);

      let y = doc.y;

      // Table header
      doc
        .fontSize(9)
        .fillColor("#000000")
        .text("Employee", 50, y, { width: 150 })
        .text("Present", 210, y, { width: 60 })
        .text("Absent", 280, y, { width: 60 })
        .text("Half Day", 350, y, { width: 60 })
        .text("Leave", 420, y, { width: 60 })
        .text("%", 490, y, { width: 60 });

      y += 20;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      Object.values(employeeMap).forEach(({ employee, summary }) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        const total =
          summary.present +
          summary.absent +
          summary.halfDay +
          summary.paidLeave;
        const percentage = (
          ((summary.present + summary.halfDay * 0.5) / total) *
          100
        ).toFixed(1);

        doc
          .text(employee.fullName, 50, y, { width: 150 })
          .text(summary.present.toString(), 210, y, { width: 60 })
          .text(summary.absent.toString(), 280, y, { width: 60 })
          .text(summary.halfDay.toString(), 350, y, { width: 60 })
          .text(summary.paidLeave.toString(), 420, y, { width: 60 })
          .text(`${percentage}%`, 490, y, { width: 60 });

        y += 20;
      });
    }

    // Footer
    doc
      .fontSize(8)
      .fillColor("#666666")
      .text(
        "Vasudevnarayan RMC Infra - Employee & Attendance Management System",
        50,
        doc.page.height - 50,
        { align: "center" }
      );

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Export attendance report as CSV
// @route   GET /api/reports/export/csv
// @access  Private
exports.exportCSV = async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    let where = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate && endDate) {
        where.date[Op.between] = [new Date(startDate), new Date(endDate)];
      } else if (startDate) {
        where.date[Op.gte] = new Date(startDate);
      } else if (endDate) {
        where.date[Op.lte] = new Date(endDate);
      }
    }

    const attendance = await Attendance.findAll({
      where,
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["fullName", "aadharNumber", "type", "currentSalary"],
        },
        { model: User, as: "marker", attributes: ["name"] },
      ],
      order: [["date", "ASC"]],
    });

    if (attendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for the specified criteria",
      });
    }

    // Prepare CSV headers
    const headers = [
      "Date",
      "Employee Name",
      "Aadhar Number",
      "Type",
      "Salary",
      "Status",
      "Note",
      "Marked By",
      "Marked At",
    ];

    // Create CSV content
    const csvRows = [];
    csvRows.push(headers.join(","));

    attendance.forEach((record) => {
      const row = [
        new Date(record.date).toLocaleDateString(),
        record.employee.fullName,
        record.employee.aadharNumber,
        record.employee.type,
        record.employee.currentSalary,
        record.status,
        record.note || "",
        record.marker.name,
        new Date(record.createdAt).toLocaleString(),
      ];
      csvRows.push(row.map((field) => `"${field}"`).join(","));
    });

    const csv = csvRows.join("\n");

    // Set response headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance-report-${Date.now()}.csv`
    );

    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

// @desc    Get salary report
// @route   GET /api/reports/salary
// @access  Private
exports.getSalaryReport = async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide start date and end date",
      });
    }

    let where = {
      date: {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      },
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const attendance = await Attendance.findAll({
      where,
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "employeeId", "fullName", "type", "currentSalary"],
        },
      ],
      order: [["date", "ASC"]],
    });

    if (attendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for the specified criteria",
      });
    }

    // Get Payment model
    const { Payment } = require("../models");

    // Process salary report data
    const salaryData = [];
    const employeeGroups = {};

    attendance.forEach((record) => {
      const empId = record.employeeId;
      if (!employeeGroups[empId]) {
        employeeGroups[empId] = {
          employee: record.employee,
          records: [],
          totalSalary: 0,
        };
      }

      // Calculate daily salary based on attendance status
      const totalDaysInMonth = new Date(
        new Date(record.date).getFullYear(),
        new Date(record.date).getMonth() + 1,
        0
      ).getDate();
      const perDaySalary = record.employee.currentSalary / totalDaysInMonth;

      let dailySalary = 0;
      if (record.status === "present" || record.status === "paid-leave") {
        dailySalary = perDaySalary;
      } else if (record.status === "half-day") {
        dailySalary = perDaySalary * 0.5;
      } else if (record.status === "absent") {
        dailySalary = 0;
      }

      employeeGroups[empId].records.push({
        date: record.date,
        status: record.status,
        dailySalary: dailySalary.toFixed(2),
        note: record.note,
      });

      employeeGroups[empId].totalSalary += dailySalary;
    });

    // Fetch payments for the selected duration
    const payments = await Payment.findAll({
      where: {
        paymentDate: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
        ...(employeeId && { employeeId }),
      },
      order: [["paymentDate", "ASC"]],
    });

    // Group payments by employee
    const paymentsByEmployee = {};
    payments.forEach((payment) => {
      if (!paymentsByEmployee[payment.employeeId]) {
        paymentsByEmployee[payment.employeeId] = [];
      }
      paymentsByEmployee[payment.employeeId].push({
        id: payment.id,
        amount: parseFloat(payment.amount),
        date: payment.paymentDate,
        remarks: payment.remarks,
      });
    });

    // Convert to array format
    Object.keys(employeeGroups).forEach((empId) => {
      const employeePayments = paymentsByEmployee[empId] || [];
      const totalPaid = employeePayments.reduce((sum, p) => sum + p.amount, 0);
      const pendingBalance = employeeGroups[empId].totalSalary - totalPaid;

      salaryData.push({
        employee: {
          id: employeeGroups[empId].employee.id,
          employeeId: employeeGroups[empId].employee.employeeId,
          fullName: employeeGroups[empId].employee.fullName,
          type: employeeGroups[empId].employee.type,
          currentSalary: employeeGroups[empId].employee.currentSalary,
        },
        records: employeeGroups[empId].records,
        totalSalary: employeeGroups[empId].totalSalary.toFixed(2),
        payments: employeePayments,
        totalPaid: totalPaid.toFixed(2),
        pendingBalance: pendingBalance.toFixed(2),
      });
    });

    res.status(200).json({
      success: true,
      data: salaryData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export salary report as PDF
// @route   GET /api/reports/salary/pdf
// @access  Private
exports.exportSalaryPDF = async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide start date and end date",
      });
    }

    let where = {
      date: {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      },
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const attendance = await Attendance.findAll({
      where,
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "employeeId", "fullName", "type", "currentSalary"],
        },
      ],
      order: [["date", "ASC"]],
    });

    if (attendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found",
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=salary-report-${Date.now()}.pdf`
    );

    doc.pipe(res);

    // Add header
    const logoPath = path.join(__dirname, "../../frontend/public/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 50, { width: 60, height: 60 });
    }

    doc
      .fontSize(24)
      .fillColor("#FF6347")
      .text("Vasudevnarayan RMC Infra", { align: "center" });

    doc
      .fontSize(12)
      .fillColor("#000000")
      .text("Salary Report", { align: "center" })
      .moveDown();

    doc.fontSize(10);
    doc.text(`From: ${new Date(startDate).toLocaleDateString()}`);
    doc.text(`To: ${new Date(endDate).toLocaleDateString()}`);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Get Payment model
    const { Payment } = require("../models");

    // Process data by employee
    const employeeGroups = {};
    attendance.forEach((record) => {
      const empId = record.employeeId;
      if (!employeeGroups[empId]) {
        employeeGroups[empId] = {
          employee: record.employee,
          records: [],
          totalSalary: 0,
        };
      }

      const totalDaysInMonth = new Date(
        new Date(record.date).getFullYear(),
        new Date(record.date).getMonth() + 1,
        0
      ).getDate();
      const perDaySalary = record.employee.currentSalary / totalDaysInMonth;

      let dailySalary = 0;
      if (record.status === "present" || record.status === "paid-leave") {
        dailySalary = perDaySalary;
      } else if (record.status === "half-day") {
        dailySalary = perDaySalary * 0.5;
      }

      employeeGroups[empId].records.push({
        date: record.date,
        status: record.status,
        dailySalary: dailySalary,
        note: record.note,
      });

      employeeGroups[empId].totalSalary += dailySalary;
    });

    // Fetch payments for the selected duration
    const payments = await Payment.findAll({
      where: {
        paymentDate: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
        ...(employeeId && { employeeId }),
      },
      order: [["paymentDate", "ASC"]],
    });

    // Group payments by employee
    const paymentsByEmployee = {};
    payments.forEach((payment) => {
      if (!paymentsByEmployee[payment.employeeId]) {
        paymentsByEmployee[payment.employeeId] = [];
      }
      paymentsByEmployee[payment.employeeId].push({
        amount: parseFloat(payment.amount),
        date: payment.paymentDate,
        remarks: payment.remarks,
      });
    });

    // Generate PDF for each employee
    Object.keys(employeeGroups).forEach((empId, index) => {
      if (index > 0) doc.addPage();

      const group = employeeGroups[empId];
      const employee = group.employee;

      doc
        .fontSize(14)
        .fillColor("#FF6347")
        .text("Employee Details", { underline: true })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor("#000000")
        .text(`Name: ${employee.fullName}`)
        .text(`Employee ID: ${employee.employeeId}`)
        .text(`Type: ${employee.type}`)
        .text(`Monthly Salary: Rs. ${employee.currentSalary}`)
        .moveDown();

      doc
        .fontSize(12)
        .fillColor("#FF6347")
        .text("Salary Details", { underline: true })
        .moveDown(0.5);

      let y = doc.y;

      // Table header
      doc
        .fontSize(9)
        .fillColor("#000000")
        .text("Date", 50, y, { width: 80 })
        .text("Status", 140, y, { width: 80 })
        .text("Daily Salary", 230, y, { width: 100 })
        .text("Note", 340, y, { width: 200 });

      y += 20;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      // Table rows
      group.records.forEach((record) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc
          .text(new Date(record.date).toLocaleDateString(), 50, y, {
            width: 80,
          })
          .text(record.status, 140, y, { width: 80 })
          .text(`Rs. ${record.dailySalary.toFixed(2)}`, 230, y, {
            width: 100,
          })
          .text(record.note || "-", 340, y, { width: 200 });

        y += 20;
      });

      y += 10;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 15;

      doc
        .fontSize(12)
        .fillColor("#FF6347")
        .font("Helvetica-Bold")
        .text(
          `Total Salary Earned: Rs. ${group.totalSalary.toFixed(2)}`,
          50,
          y
        );

      // Add payments section if any
      const employeePayments = paymentsByEmployee[empId] || [];
      if (employeePayments.length > 0) {
        y += 25;
        doc
          .fontSize(12)
          .fillColor("#3B82F6")
          .font("Helvetica-Bold")
          .text("Payments Made:", 50, y);
        y += 20;

        employeePayments.forEach((payment) => {
          if (y > 720) {
            doc.addPage();
            y = 50;
          }
          const paymentDate = new Date(payment.date).toLocaleDateString();
          const label = payment.remarks
            ? `${paymentDate} - ${payment.remarks}`
            : paymentDate;
          doc
            .fontSize(10)
            .fillColor("#000000")
            .font("Helvetica")
            .text(label, 50, y)
            .font("Helvetica-Bold")
            .text(`Rs. ${payment.amount.toFixed(2)}`, 400, y);
          y += 20;
        });

        const totalPaid = employeePayments.reduce(
          (sum, p) => sum + p.amount,
          0
        );
        y += 5;
        doc
          .fontSize(11)
          .fillColor("#3B82F6")
          .font("Helvetica-Bold")
          .text(`Total Paid: Rs. ${totalPaid.toFixed(2)}`, 50, y);

        y += 20;
        const pendingBalance = group.totalSalary - totalPaid;
        doc
          .fontSize(13)
          .fillColor("#DC2626")
          .font("Helvetica-Bold")
          .text(`Pending Balance: Rs. ${pendingBalance.toFixed(2)}`, 50, y);
      }
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};
