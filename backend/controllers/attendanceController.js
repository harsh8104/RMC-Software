const { Attendance, Employee, User } = require("../models");
const { Op } = require("sequelize");

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
exports.getAttendance = async (req, res, next) => {
  try {
    const {
      employeeId,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 50,
    } = req.query;

    // Build query
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

    if (status) {
      where.status = status;
    }

    // Pagination
    const offset = (page - 1) * limit;

    const { rows: attendance, count: total } = await Attendance.findAndCountAll(
      {
        where,
        include: [
          {
            model: Employee,
            as: "employee",
            attributes: ["fullName", "photo", "type"],
          },
          { model: User, as: "marker", attributes: ["name"] },
        ],
        order: [["date", "DESC"]],
        offset,
        limit: parseInt(limit),
      }
    );

    res.status(200).json({
      success: true,
      count: attendance.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark attendance for a single employee
// @route   POST /api/attendance/mark
// @access  Private
exports.markAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, status, note } = req.body;

    // Check if employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      where: {
        employeeId: employeeId,
        date: new Date(date),
      },
    });

    let attendance;

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.note = note;
      existingAttendance.markedBy = req.user.id;
      attendance = await existingAttendance.save();
    } else {
      // Create new attendance record
      attendance = await Attendance.create({
        employeeId: employeeId,
        date: new Date(date),
        status,
        note,
        markedBy: req.user.id,
      });
    }

    attendance = await Attendance.findByPk(attendance.id, {
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["fullName", "photo", "type"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save attendance",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// @desc    Bulk mark attendance (all employees for a date)
// @route   POST /api/attendance/bulk-mark
// @access  Private
exports.bulkMarkAttendance = async (req, res, next) => {
  try {
    const { date, status, employeeIds } = req.body;

    if (!date || !status) {
      return res.status(400).json({
        success: false,
        message: "Please provide date and status",
      });
    }

    let employees;

    if (employeeIds && employeeIds.length > 0) {
      employees = await Employee.findAll({
        where: {
          id: { [Op.in]: employeeIds },
          status: "active",
        },
      });
    } else {
      employees = await Employee.findAll({ where: { status: "active" } });
    }

    const attendanceRecords = [];
    const errors = [];

    for (const employee of employees) {
      try {
        const existingAttendance = await Attendance.findOne({
          where: {
            employeeId: employee.id,
            date: new Date(date),
          },
        });

        if (existingAttendance) {
          existingAttendance.status = status;
          existingAttendance.markedBy = req.user.id;
          await existingAttendance.save();
          attendanceRecords.push(existingAttendance);
        } else {
          const attendance = await Attendance.create({
            employeeId: employee.id,
            date: new Date(date),
            status,
            markedBy: req.user.id,
          });
          attendanceRecords.push(attendance);
        }
      } catch (err) {
        errors.push({ employeeId: employee.id, error: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Marked attendance for ${attendanceRecords.length} employees`,
      count: attendanceRecords.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private
exports.updateAttendance = async (req, res, next) => {
  try {
    let attendance = await Attendance.findByPk(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    const { status, note } = req.body;

    attendance.status = status || attendance.status;
    attendance.note = note !== undefined ? note : attendance.note;
    attendance.markedBy = req.user.id;

    attendance = await attendance.save();
    attendance = await Attendance.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["fullName", "photo", "type"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private
exports.deleteAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    await attendance.destroy();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance summary for an employee
// @route   GET /api/attendance/summary/:employeeId
// @access  Private
exports.getEmployeeAttendanceSummary = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    let where = { employeeId: employeeId };

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

    const attendance = await Attendance.findAll({ where });

    const summary = {
      total: attendance.length,
      present: attendance.filter((a) => a.status === "present").length,
      absent: attendance.filter((a) => a.status === "absent").length,
      halfDay: attendance.filter((a) => a.status === "half-day").length,
      paidLeave: attendance.filter((a) => a.status === "paid-leave").length,
    };

    summary.presentPercentage =
      summary.total > 0
        ? (
            ((summary.present + summary.halfDay * 0.5) / summary.total) *
            100
          ).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          fullName: employee.fullName,
          photo: employee.photo,
          type: employee.type,
        },
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent attendance activity
// @route   GET /api/attendance/recent
// @access  Private
exports.getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const recentAttendance = await Attendance.findAll({
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["fullName", "photo", "type"],
        },
        { model: User, as: "marker", attributes: ["name"] },
      ],
      order: [["updatedAt", "DESC"]],
      limit,
    });

    res.status(200).json({
      success: true,
      count: recentAttendance.length,
      data: recentAttendance,
    });
  } catch (error) {
    next(error);
  }
};
