const { Payment, Employee } = require("../models");
const { Op } = require("sequelize");

// @desc    Add new payment
// @route   POST /api/payments
// @access  Private
exports.addPayment = async (req, res, next) => {
  try {
    const { employeeId, amount, paymentDate, month, year, remarks } = req.body;

    // Validate required fields
    if (!employeeId || !amount || !paymentDate || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Create payment
    const payment = await Payment.create({
      employeeId,
      amount,
      paymentDate,
      month,
      year,
      remarks,
    });

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments with filters
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res, next) => {
  try {
    const { employeeId, month, year, page = 1, limit = 50 } = req.query;

    const where = {};

    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = month;
    if (year) where.year = year;

    const offset = (page - 1) * limit;

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "fullName", "aadharNumber", "type"],
        },
      ],
      order: [["paymentDate", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    res.status(200).json({
      success: true,
      count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payments for specific employee
// @route   GET /api/payments/employee/:employeeId
// @access  Private
exports.getEmployeePayments = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    const where = { employeeId };

    if (month) where.month = month;
    if (year) where.year = year;

    const payments = await Payment.findAll({
      where,
      order: [["paymentDate", "DESC"]],
    });

    // Calculate total paid
    const totalPaid = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount),
      0
    );

    res.status(200).json({
      success: true,
      data: payments,
      totalPaid: totalPaid.toFixed(2),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: [
            "id",
            "fullName",
            "aadharNumber",
            "type",
            "currentSalary",
          ],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
exports.updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const { amount, paymentDate, month, year, remarks } = req.body;

    await payment.update({
      amount: amount || payment.amount,
      paymentDate: paymentDate || payment.paymentDate,
      month: month || payment.month,
      year: year || payment.year,
      remarks: remarks !== undefined ? remarks : payment.remarks,
    });

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
exports.deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    await payment.destroy();

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment summary for month
// @route   GET /api/payments/summary/:employeeId
// @access  Private
exports.getPaymentSummary = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Please provide month and year",
      });
    }

    const payments = await Payment.findAll({
      where: {
        employeeId,
        month,
        year,
      },
      order: [["paymentDate", "ASC"]],
    });

    const totalPaid = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        payments,
        totalPaid: totalPaid.toFixed(2),
        paymentCount: payments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
