const { Employee, Attendance } = require("../models");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

// Helper function to generate employee ID based on role
const generateEmployeeId = async (role) => {
  const roleAbbreviations = {
    "TM Driver": "TD",
    "TM Helper": "TH",
    "Plant Operator": "PO",
    "Loader Operator": "LO",
    "Quality In charge": "QI",
    "Lab Helper": "LH",
    "Plant Helper": "PH",
    "Dispatch Manager": "DM",
    Accountant: "AC",
    "Plant Manager": "PM",
    "Pump supervisor": "PS",
  };

  const prefix = "VN" + roleAbbreviations[role];

  // Find the last employee with this role prefix
  const lastEmployee = await Employee.findOne({
    where: {
      employeeId: {
        [Op.like]: `${prefix}-%`,
      },
    },
    order: [["employeeId", "DESC"]],
  });

  let nextNumber = 1;
  if (lastEmployee) {
    // Extract the number from the last employee ID (e.g., VNTD-0001 -> 1)
    const lastNumber = parseInt(lastEmployee.employeeId.split("-")[1]);
    nextNumber = lastNumber + 1;
  }

  // Format with leading zeros (e.g., 0001)
  const formattedNumber = String(nextNumber).padStart(4, "0");
  return `${prefix}-${formattedNumber}`;
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
exports.getEmployees = async (req, res, next) => {
  try {
    const { search, type, status, sortBy, page = 1, limit = 10 } = req.query;

    // Build query
    let where = {};

    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { aadharNumber: { [Op.like]: `%${search}%` } },
        { employeeId: { [Op.like]: `%${search}%` } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    // Sorting
    let order = [];
    if (sortBy) {
      const parts = sortBy.split(":");
      order.push([parts[0], parts[1] === "desc" ? "DESC" : "ASC"]);
    } else {
      order.push(["createdAt", "DESC"]);
    }

    // Pagination
    const offset = (page - 1) * limit;

    const { rows: employees, count: total } = await Employee.findAndCountAll({
      where,
      order,
      offset,
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private
exports.createEmployee = async (req, res, next) => {
  try {
    // Generate employee ID based on role
    const employeeId = await generateEmployeeId(req.body.type);
    req.body.employeeId = employeeId;

    // Add photo if uploaded
    if (req.file) {
      req.body.photo = req.file.filename;
    }

    const employee = await Employee.create(req.body);

    res.status(201).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    // Delete uploaded file if employee creation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
exports.updateEmployee = async (req, res, next) => {
  try {
    let employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if role has changed and regenerate employee ID
    if (req.body.type && req.body.type !== employee.type) {
      const newEmployeeId = await generateEmployeeId(req.body.type);
      req.body.employeeId = newEmployeeId;
    }

    // Handle photo update
    if (req.file) {
      // Delete old photo if exists and not default
      if (employee.photo && employee.photo !== "default-avatar.png") {
        const oldPhotoPath = path.join(
          __dirname,
          "../../uploads",
          employee.photo
        );
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      req.body.photo = req.file.filename;
    }

    await employee.update(req.body);
    employee = await Employee.findByPk(req.params.id);

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Delete photo if exists and not default
    if (employee.photo && employee.photo !== "default-avatar.png") {
      const photoPath = path.join(__dirname, "../../uploads", employee.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // Delete all attendance records for this employee
    await Attendance.destroy({ where: { employeeId: req.params.id } });

    await employee.destroy();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employee statistics
// @route   GET /api/employees/stats/dashboard
// @access  Private
exports.getEmployeeStats = async (req, res, next) => {
  try {
    const totalEmployees = await Employee.count({
      where: { status: "active" },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await Attendance.findAll({
      where: {
        date: {
          [Op.between]: [
            today,
            new Date(today.getTime() + 24 * 60 * 60 * 1000),
          ],
        },
      },
    });

    const presentToday = todayAttendance.filter(
      (a) => a.status === "present" || a.status === "half-day"
    ).length;
    const absentToday = totalEmployees - presentToday;

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        absentToday,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk import employees from CSV
// @route   POST /api/employees/import
// @access  Private
exports.importEmployees = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a CSV file",
      });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        let imported = 0;

        for (let i = 0; i < results.length; i++) {
          try {
            const row = results[i];
            await Employee.create({
              fullName: row.fullName || row.name,
              aadharNumber: row.aadharNumber,
              address: row.address,
              currentSalary: parseFloat(row.currentSalary || row.salary),
              type: row.type,
              bonus: parseFloat(row.bonus || 0),
            });
            imported++;
          } catch (err) {
            errors.push({ row: i + 1, error: err.message });
          }
        }

        // Delete uploaded file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
          success: true,
          message: `Imported ${imported} employees`,
          imported,
          errors: errors.length > 0 ? errors : undefined,
        });
      });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};
