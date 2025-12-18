const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Employee = sequelize.define(
  "Employee",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    employeeId: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Please add employee full name",
        },
      },
    },
    mobileNumber: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        is: {
          args: /^\d{10}$/,
          msg: "Please add a valid 10-digit mobile number",
        },
      },
    },
    photo: {
      type: DataTypes.STRING,
      defaultValue: "default-avatar.png",
    },
    aadharNumber: {
      type: DataTypes.STRING(12),
      allowNull: false,
      unique: true,
      validate: {
        is: {
          args: /^\d{12}$/,
          msg: "Please add a valid 12-digit Aadhar number",
        },
      },
    },
    panNumber: {
      type: DataTypes.STRING(10),
      allowNull: true,
      unique: true,
      validate: {
        isValidPAN(value) {
          if (value && value.trim() !== "") {
            if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(value)) {
              throw new Error(
                "Please add a valid PAN number (e.g., ABCDE1234F)"
              );
            }
          }
        },
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Please add address",
        },
      },
    },
    bankAccountNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Please add bank account number",
        },
      },
    },
    bankIfscCode: {
      type: DataTypes.STRING(11),
      allowNull: false,
      validate: {
        is: {
          args: /^[A-Z]{4}0[A-Z0-9]{6}$/,
          msg: "Please add a valid IFSC code",
        },
      },
    },
    bankAccountName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Please add bank account holder name",
        },
      },
    },
    currentSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Salary must be a positive number",
        },
      },
    },
    type: {
      type: DataTypes.ENUM(
        "TM Driver",
        "TM Helper",
        "Plant Operator",
        "Loader Operator",
        "Quality In charge",
        "Lab Helper",
        "Plant Helper",
        "Dispatch Manager",
        "Accountant",
        "Plant Manager",
        "Pump supervisor"
      ),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Please specify employee type",
        },
      },
    },
    bonus: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      set(value) {
        // Convert empty string to 0
        this.setDataValue("bonus", value === "" || value === null ? 0 : value);
      },
      validate: {
        min: {
          args: [0],
          msg: "Bonus must be a positive number",
        },
      },
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },
  {
    tableName: "employees",
    timestamps: true,
  }
);

module.exports = Employee;
