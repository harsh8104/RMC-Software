import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  DocumentArrowDownIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Reports = () => {
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({
    employeeId: "",
    reportType: "monthly",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    setDefaultDates();
  }, []);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchAnalytics();
    }
  }, [filters]);

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
        startDate = new Date(today.setMonth(today.getMonth() - 1));
        break;
      case "yearly":
        startDate = new Date(today.setFullYear(today.getFullYear() - 1));
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

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      if (filters.employeeId) {
        params.append("employeeId", filters.employeeId);
      }

      const res = await axios.get(`/api/reports/analytics?${params}`);
      setAnalytics(res.data.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      if (filters.employeeId) {
        params.append("employeeId", filters.employeeId);
      }

      const response = await axios.get(
        `/api/reports/export/${format}?${params}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to export report");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Reports & Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate attendance reports and view analytics
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
              Employee
            </label>
            <select
              value={filters.employeeId}
              onChange={(e) =>
                setFilters({ ...filters, employeeId: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
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
              Report Type
            </label>
            <select
              value={filters.reportType}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
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
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
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
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="mt-4 flex space-x-3">
          <button
            onClick={() => handleExport("pdf")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Analytics */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : analytics ? (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-100 rounded-lg p-3">
                  <ChartBarIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Records
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.overview.totalRecords}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <ChartBarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Present</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.overview.present}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Paid Leave
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.overview.paidLeave}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
                  <ChartBarIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Absent</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.overview.absent}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                  <ChartBarIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Attendance %
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.overview.presentPercentage}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          {analytics.dailyBreakdown && analytics.dailyBreakdown.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Bar Chart */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Daily Attendance Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.dailyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill="#10b981" name="Present" />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                    <Bar dataKey="halfDay" fill="#f59e0b" name="Half Day" />
                    <Bar dataKey="paidLeave" fill="#3b82f6" name="Paid Leave" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Line Chart */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Attendance Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.dailyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="present"
                      stroke="#10b981"
                      name="Present"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="absent"
                      stroke="#ef4444"
                      name="Absent"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default Reports;
