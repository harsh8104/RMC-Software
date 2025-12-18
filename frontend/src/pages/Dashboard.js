import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import DefaultAvatar from "../components/DefaultAvatar";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/employees/stats/dashboard");
      setStats(res.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const res = await axios.get("/api/attendance/recent?limit=10");
      setRecentActivity(res.data.data);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.trim().length > 0) {
      try {
        const res = await axios.get(`/api/employees?search=${term}&limit=5`);
        setSearchResults(res.data.data);
      } catch (error) {
        console.error("Error searching employees:", error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "text-green-600 bg-green-50";
      case "absent":
        return "text-red-600 bg-red-50";
      case "half-day":
        return "text-yellow-600 bg-yellow-50";
      case "paid-leave":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to Vasudevnarayan RMC Infra Management
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/employees/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600"
          >
            Add Employee
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees by name or Aadhar number..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200">
            {searchResults.map((employee) => (
              <Link
                key={employee.id}
                to={`/employees/${employee.id}`}
                onClick={() => {
                  setSearchTerm("");
                  setSearchResults([]);
                }}
                className="block px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
              >
                <div className="flex items-center">
                  <img
                    src={
                      employee.photo
                        ? `/uploads/${employee.photo}`
                        : "/default-avatar.png"
                    }
                    alt={employee.fullName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {employee.fullName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {employee.aadharNumber}
                    </p>
                  </div>
                  <span
                    className={`ml-auto px-2 py-1 text-xs font-medium rounded-full ${
                      employee.type === "driver"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    {employee.type}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-primary-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Employees
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {stats.totalEmployees}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Present Today
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {stats.presentToday}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Absent Today
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {stats.absentToday}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link
            to="/employees/new"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <UsersIcon className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Add Employee
            </span>
          </Link>
          <Link
            to="/attendance"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <CheckCircleIcon className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Mark Attendance
            </span>
          </Link>
          <Link
            to="/employees"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <UsersIcon className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              View Employees
            </span>
          </Link>
          <Link
            to="/reports"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <CheckCircleIcon className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Generate Report
            </span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Recent Attendance Activity
          </h2>
        </div>
        <ul className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.map((record) => (
              <li key={record.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    {record.employee?.photo &&
                    record.employee.photo !== "default-avatar.png" ? (
                      <img
                        src={`/uploads/${record.employee.photo}`}
                        alt={record.employee?.fullName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <DefaultAvatar className="h-10 w-10 rounded-full" />
                    )}
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {record.employee?.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(record.date)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        record.status
                      )}`}
                    >
                      {record.status}
                    </span>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-6 py-12 text-center">
              <p className="text-sm text-gray-500">
                No recent attendance activity
              </p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
