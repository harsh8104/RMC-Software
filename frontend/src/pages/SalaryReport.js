import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  DocumentArrowDownIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const SalaryReport = () => {
  const [employees, setEmployees] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [filters, setFilters] = useState({
    employeeId: "",
    reportType: "monthly",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmployees();
    setDefaultDates();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("/api/employees?status=active&limit=100");
      setEmployees(res.data.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const setDefaultDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    setFilters((prev) => ({
      ...prev,
      startDate: firstDay.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    }));
  };

  const handleReportTypeChange = (type) => {
    const today = new Date();
    let startDate;

    switch (type) {
      case "weekly":
        startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case "monthly":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(today.setMonth(today.getMonth() - 1));
    }

    setFilters({
      ...filters,
      reportType: type,
      startDate: startDate.toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    });
  };

  const fetchSalaryReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError("Please provide start and end dates");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      if (filters.employeeId) {
        params.append("employeeId", filters.employeeId);
      }

      const res = await axios.get(`/api/reports/salary?${params}`);
      setSalaryData(res.data.data);
    } catch (error) {
      setError(error.response?.data?.message || "Error fetching salary report");
      console.error("Error fetching salary report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError("Please provide start and end dates");
      return;
    }

    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      if (filters.employeeId) {
        params.append("employeeId", filters.employeeId);
      }

      const response = await axios.get(`/api/reports/salary/pdf?${params}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `salary-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF");
    }
  };

  const getTotalPendingBalance = () => {
    return salaryData
      .reduce((sum, emp) => sum + parseFloat(emp.pendingBalance), 0)
      .toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <CurrencyRupeeIcon className="h-8 w-8 text-tomato mr-3" />
          Salary Report
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate detailed salary reports based on attendance
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Report Filters
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <UserIcon className="h-5 w-5 inline mr-2" />
              Employee
            </label>
            <select
              value={filters.employeeId}
              onChange={(e) =>
                setFilters({ ...filters, employeeId: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-tomato focus:border-tomato"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CalendarIcon className="h-5 w-5 inline mr-2" />
              Report Type
            </label>
            <select
              value={filters.reportType}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-tomato focus:border-tomato"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-tomato focus:border-tomato"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-tomato focus:border-tomato"
            />
          </div>
        </div>

        <div className="mt-4 flex space-x-3">
          <button
            onClick={fetchSalaryReport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-tomato hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Generate Report"}
          </button>
          {salaryData.length > 0 && (
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export PDF
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Salary Report Data */}
      {salaryData.length > 0 && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-tomato to-red-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg opacity-90">Total Pending Balance</p>
                <p className="text-sm opacity-75">
                  From {new Date(filters.startDate).toLocaleDateString()} to{" "}
                  {new Date(filters.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold flex items-center">
                  <CurrencyRupeeIcon className="h-10 w-10 mr-2" />
                  {getTotalPendingBalance()}
                </p>
              </div>
            </div>
          </div>

          {/* Employee-wise Salary Details */}
          {salaryData.map((empData) => (
            <div
              key={empData.employee.id}
              className="bg-white shadow rounded-lg p-6"
            >
              {/* Employee Header */}
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {empData.employee.fullName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Employee ID: {empData.employee.employeeId} | Type:{" "}
                      {empData.employee.type.toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Monthly Salary: ₹ {empData.employee.currentSalary}
                    </p>
                  </div>
                  <div className="bg-green-50 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-600">Total to Pay</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹ {empData.totalSalary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Salary Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Daily Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {empData.records.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.status === "present"
                                ? "bg-green-100 text-green-800"
                                : record.status === "paid-leave"
                                ? "bg-blue-100 text-blue-800"
                                : record.status === "half-day"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₹ {record.dailySalary}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {record.note || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan="2"
                        className="px-6 py-4 text-sm font-bold text-gray-900"
                      >
                        Total Earned
                      </td>
                      <td
                        colSpan="2"
                        className="px-6 py-4 text-sm font-bold text-green-600"
                      >
                        ₹ {empData.totalSalary}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payments Made Section */}
              {empData.payments && empData.payments.length > 0 && (
                <div className="mt-6 bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <svg
                      className="h-6 w-6 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Payments Made (During Selected Period)
                  </h4>
                  <div className="space-y-2">
                    {empData.payments.map((payment, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-white p-3 rounded"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(payment.date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                          {payment.remarks && (
                            <p className="text-sm text-gray-600">
                              {payment.remarks}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-blue-800">
                          ₹ {payment.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center border-t-2 border-blue-300 pt-3 mt-3">
                      <span className="text-lg font-semibold text-blue-900">
                        Total Paid
                      </span>
                      <span className="font-bold text-blue-800 text-xl">
                        ₹ {empData.totalPaid}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Balance */}
              <div className="mt-4 bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg opacity-90">Pending Balance</p>
                    <p className="text-sm opacity-75">
                      Amount remaining to be paid
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold flex items-center">
                      <CurrencyRupeeIcon className="h-10 w-10 mr-2" />
                      {empData.pendingBalance}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && salaryData.length === 0 && filters.startDate && (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">
            No salary data available. Click "Generate Report" to fetch data.
          </p>
        </div>
      )}
    </div>
  );
};

export default SalaryReport;
