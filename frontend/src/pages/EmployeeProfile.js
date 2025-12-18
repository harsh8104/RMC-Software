import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeftIcon, PencilIcon } from "@heroicons/react/24/outline";
import DefaultAvatar from "../components/DefaultAvatar";

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  useEffect(() => {
    if (employee) {
      fetchAttendanceSummary();
    }
  }, [period, employee]);

  const fetchEmployee = async () => {
    try {
      const res = await axios.get(`/api/employees/${id}`);
      setEmployee(res.data.data);
    } catch (error) {
      console.error("Error fetching employee:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const now = new Date();
      let startDate;

      switch (period) {
        case "weekly":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "monthly":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "yearly":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setMonth(now.getMonth() - 1));
      }

      const res = await axios.get(
        `/api/attendance/summary/${id}?startDate=${startDate.toISOString()}`
      );
      setSummary(res.data.data.summary);
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Employee not found</p>
        <button
          onClick={() => navigate("/employees")}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to Employees
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/employees")}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Employees
        </button>
        <Link
          to={`/employees/edit/${id}`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600"
        >
          <PencilIcon className="h-5 w-5 mr-2" />
          Edit Employee
        </Link>
      </div>

      {/* Employee Details Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {employee.photo && employee.photo !== "default-avatar.png" ? (
              <img
                src={`/uploads/${employee.photo}`}
                alt={employee.fullName}
                className="h-32 w-32 rounded-full object-cover"
              />
            ) : (
              <DefaultAvatar className="h-32 w-32 rounded-full" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {employee.fullName}
                </h1>
                {employee.employeeId && (
                  <span className="px-3 py-1 text-lg font-bold text-primary-600 bg-primary-50 border-2 border-primary-200 rounded-lg">
                    {employee.employeeId}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary-100 text-primary-800">
                  {employee.type}
                </span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    employee.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.status}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Mobile Number</p>
              <p className="mt-1 text-sm text-gray-900">
                {employee.mobileNumber}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Aadhar Number</p>
              <p className="mt-1 text-sm text-gray-900">
                {employee.aadharNumber}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">PAN Number</p>
              <p className="mt-1 text-sm text-gray-900">{employee.panNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Current Salary
              </p>
              <p className="mt-1 text-sm text-gray-900">
                ₹{employee.currentSalary.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Bonus</p>
              <p className="mt-1 text-sm text-gray-900">
                ₹{employee.bonus ? employee.bonus.toLocaleString() : "0"}
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="mt-1 text-sm text-gray-900">{employee.address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Bank Account Number
              </p>
              <p className="mt-1 text-sm text-gray-900">
                {employee.bankAccountNumber}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">IFSC Code</p>
              <p className="mt-1 text-sm text-gray-900">
                {employee.bankIfscCode}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Account Holder Name
              </p>
              <p className="mt-1 text-sm text-gray-900">
                {employee.bankAccountName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Attendance Summary
          </h2>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
            <option value="yearly">Last Year</option>
          </select>
        </div>

        {summary && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Total Days</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {summary.total}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-600">Present</p>
                <p className="mt-2 text-2xl font-semibold text-green-900">
                  {summary.present}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-red-600">Absent</p>
                <p className="mt-2 text-2xl font-semibold text-red-900">
                  {summary.absent}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-yellow-600">Half Day</p>
                <p className="mt-2 text-2xl font-semibold text-yellow-900">
                  {summary.halfDay}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-600">Paid Leave</p>
                <p className="mt-2 text-2xl font-semibold text-blue-900">
                  {summary.onLeave}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-primary-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-primary-600">
                Attendance Percentage
              </p>
              <div className="mt-2 flex items-end">
                <p className="text-3xl font-bold text-primary-900">
                  {summary.presentPercentage}%
                </p>
                <div className="ml-4 flex-1">
                  <div className="w-full bg-primary-200 rounded-full h-3">
                    <div
                      className="bg-primary-500 h-3 rounded-full transition-all"
                      style={{ width: `${summary.presentPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;
