import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UserIcon,
  CurrencyRupeeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const Payslips = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState("monthly");
  const [payslipData, setPayslipData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(data.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const generatePayslip = async () => {
    if (!selectedEmployee) {
      setError("Please select an employee");
      return;
    }

    setLoading(true);
    setError("");
    setPayslipData(null);
    setYearlyData(null);

    try {
      const token = localStorage.getItem("token");

      if (period === "monthly") {
        const { data } = await axios.get(
          `http://localhost:5000/api/payslip/${selectedEmployee}`,
          {
            params: { month, year },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPayslipData(data.data);
      } else {
        const { data } = await axios.get(
          `http://localhost:5000/api/payslip/${selectedEmployee}/yearly`,
          {
            params: { year },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setYearlyData(data.data);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error generating payslip");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!selectedEmployee) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/payslip/${selectedEmployee}/pdf`,
        {
          params: { month, year },
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `payslip-${month}-${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <DocumentTextIcon className="h-8 w-8 text-tomato mr-3" />
          Payslip Generator
        </h1>
        <p className="mt-2 text-gray-600">
          Generate and download employee payslips for monthly or yearly periods
        </p>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="h-5 w-5 inline mr-2" />
              Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-tomato focus:border-tomato"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} - {emp.type}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="h-5 w-5 inline mr-2" />
              Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-tomato focus:border-tomato"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Month Selection (only for monthly) */}
          {period === "monthly" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-5 w-5 inline mr-2" />
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-tomato focus:border-tomato"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Year Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-5 w-5 inline mr-2" />
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-tomato focus:border-tomato"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={generatePayslip}
            disabled={loading || !selectedEmployee}
            className="flex-1 bg-tomato text-white px-6 py-3 rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              "Generating..."
            ) : (
              <>
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Generate Payslip
              </>
            )}
          </button>

          {period === "monthly" && payslipData && (
            <button
              onClick={downloadPDF}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 flex items-center justify-center"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Download PDF
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Monthly Payslip Display */}
      {payslipData && period === "monthly" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="border-b-2 border-tomato pb-4 mb-6">
            <h2 className="text-2xl font-bold text-tomato text-center">
              Vasudevnarayan RMC Infra
            </h2>
            <h3 className="text-xl font-semibold text-gray-800 text-center mt-2">
              SALARY SLIP
            </h3>
            <p className="text-center text-gray-600 mt-2">
              Period: {payslipData.period.month} {payslipData.period.year}
            </p>
          </div>

          {/* Employee Details */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
              Employee Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Employee Name</p>
                <p className="font-medium">{payslipData.employee.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Employee ID</p>
                <p className="font-medium">{payslipData.employee.employeeId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Aadhar Number</p>
                <p className="font-medium">{payslipData.employee.aadhar}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Designation</p>
                <p className="font-medium uppercase">
                  {payslipData.employee.type}
                </p>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
              Attendance Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Days</p>
                <p className="text-2xl font-bold text-blue-600">
                  {payslipData.period.totalDays}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Present Days</p>
                <p className="text-2xl font-bold text-green-600">
                  {payslipData.attendance.present}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Half Days</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {payslipData.attendance.halfDay}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Absent Days</p>
                <p className="text-2xl font-bold text-red-600">
                  {payslipData.attendance.absent}
                </p>
              </div>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Earnings */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-green-800 mb-3">
                Earnings
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Basic Salary</span>
                  <span className="font-medium">
                    ₹ {payslipData.salary.basic}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Earned Salary</span>
                  <span className="font-medium">
                    ₹ {payslipData.salary.earned}
                  </span>
                </div>
                {payslipData.salary.bonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Bonus</span>
                    <span className="font-medium">
                      ₹ {payslipData.salary.bonus}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t-2 border-green-300">
                  <span className="font-bold text-green-800">
                    Total Earnings
                  </span>
                  <span className="font-bold text-green-800">
                    ₹ {payslipData.salary.totalEarnings}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-red-800 mb-3">
                Deductions
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Absent Days</span>
                  <span className="font-medium">
                    ₹ {payslipData.deductions.absent}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Half Days</span>
                  <span className="font-medium">
                    ₹ {payslipData.deductions.halfDay}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-red-300">
                  <span className="font-bold text-red-800">
                    Total Deductions
                  </span>
                  <span className="font-bold text-red-800">
                    ₹ {payslipData.deductions.total}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payments Made Section */}
          {payslipData.payments && payslipData.payments.length > 0 && (
            <div className="bg-white p-6 rounded-lg border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
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
                Payments Made
              </h3>
              <div className="space-y-2">
                {payslipData.payments.map((payment, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-blue-50 p-3 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(payment.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      {payment.remarks && (
                        <p className="text-sm text-gray-600">
                          {payment.remarks}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-blue-800">
                      ₹ {payment.amount}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center border-t-2 border-blue-300 pt-3 mt-3">
                  <span className="text-lg font-semibold text-blue-900">
                    Total Paid
                  </span>
                  <span className="font-bold text-blue-800 text-xl">
                    ₹ {payslipData.totalPaid}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Gross Salary */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg opacity-90">Gross Salary</p>
                <p className="text-sm opacity-75">
                  ({payslipData.attendance.effectiveWorkingDays} effective
                  working days)
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold flex items-center">
                  <CurrencyRupeeIcon className="h-8 w-8 mr-1" />
                  {payslipData.netSalary}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Balance */}
          {payslipData.payments && payslipData.payments.length > 0 && (
            <div className="bg-gradient-to-r from-tomato to-red-600 p-6 rounded-lg text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg opacity-90">Pending Balance</p>
                  <p className="text-sm opacity-75">
                    Amount remaining to be paid
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold flex items-center">
                    <CurrencyRupeeIcon className="h-8 w-8 mr-1" />
                    {payslipData.pendingBalance}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Generated on: {payslipData.generatedDate}</p>
            <p className="mt-1">
              This is a computer-generated document. No signature is required.
            </p>
          </div>
        </div>
      )}

      {/* Yearly Summary Display */}
      {yearlyData && period === "yearly" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="border-b-2 border-tomato pb-4 mb-6">
            <h2 className="text-2xl font-bold text-tomato text-center">
              Vasudevnarayan RMC Infra
            </h2>
            <h3 className="text-xl font-semibold text-gray-800 text-center mt-2">
              YEARLY SALARY SUMMARY - {yearlyData.year}
            </h3>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Employee Details
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{yearlyData.employee.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Aadhar</p>
                <p className="font-medium">{yearlyData.employee.aadhar}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium uppercase">
                  {yearlyData.employee.type}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Present
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Half Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Absent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gross Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {yearlyData.monthlyData.map((monthData, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {monthData.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600">
                      {monthData.present}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-yellow-600">
                      {monthData.halfDay}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600">
                      {monthData.absent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      ₹ {parseFloat(monthData.netSalary).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-blue-600">
                      ₹ {parseFloat(monthData.totalPaid).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-tomato">
                      ₹ {parseFloat(monthData.pendingBalance).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-tomato text-white">
                <tr>
                  <td
                    className="px-6 py-4 whitespace-nowrap font-bold"
                    colSpan="6"
                  >
                    YEARLY TOTAL PENDING
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-xl">
                    ₹ {parseFloat(yearlyData.yearlyTotal).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payslips;
