import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import DefaultAvatar from "../components/DefaultAvatar";

const AttendanceSheet = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/employees?status=active&limit=100");
      setEmployees(res.data.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await axios.get(
        `/api/attendance?startDate=${selectedDate}&endDate=${selectedDate}`
      );
      const attendanceMap = {};
      res.data.data.forEach((record) => {
        attendanceMap[record.employeeId] = {
          status: record.status,
          note: record.note || "",
          id: record.id,
        };
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchAttendance();
    }
  }, [selectedDate, employees, fetchAttendance]);

  const handleStatusChange = (employeeId, status) => {
    setAttendance({
      ...attendance,
      [employeeId]: {
        ...attendance[employeeId],
        status,
      },
    });
  };

  const handleNoteChange = (employeeId, note) => {
    setAttendance({
      ...attendance,
      [employeeId]: {
        ...attendance[employeeId],
        note,
      },
    });
  };

  const handleMarkAll = async (status) => {
    if (window.confirm(`Mark all employees as ${status}?`)) {
      setSaving(true);
      try {
        await axios.post("/api/attendance/bulk-mark", {
          date: selectedDate,
          status,
        });
        await fetchAttendance();
        alert("Attendance marked successfully");
      } catch (error) {
        console.error("Error marking attendance:", error);
        alert("Failed to mark attendance");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSave = async (employeeId) => {
    const record = attendance[employeeId];
    if (!record || !record.status) {
      alert("Please select attendance status");
      return;
    }

    setSaving(true);
    try {
      await axios.post("/api/attendance/mark", {
        employeeId,
        date: selectedDate,
        status: record.status,
        note: record.note || "",
      });
      await fetchAttendance();
      alert("Attendance saved successfully");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 border-green-300";
      case "absent":
        return "bg-red-100 text-red-800 border-red-300";
      case "half-day":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "paid-leave":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter((employee) => {
    const query = searchQuery.toLowerCase();
    return (
      employee.fullName.toLowerCase().includes(query) ||
      employee.type.toLowerCase().includes(query) ||
      employee.mobileNumber.includes(query)
    );
  });

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Sheet</h1>
        <p className="mt-1 text-sm text-gray-500">
          Mark daily attendance for all employees
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleMarkAll("present")}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll("absent")}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              <XCircleIcon className="h-5 w-5 mr-2" />
              Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, role, or mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-500">
            Found {filteredEmployees.length} employee
            {filteredEmployees.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Attendance List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => {
                const record = attendance[employee.id] || {};
                return (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {employee.photo &&
                        employee.photo !== "default-avatar.png" ? (
                          <img
                            src={`/uploads/${employee.photo}`}
                            alt={employee.fullName}
                            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="flex-shrink-0">
                            <DefaultAvatar className="h-10 w-10 rounded-full" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={record.status || ""}
                        onChange={(e) =>
                          handleStatusChange(employee.id, e.target.value)
                        }
                        className={`px-3 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          record.status
                            ? getStatusColor(record.status)
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select Status</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="half-day">Half Day</option>
                        <option value="paid-leave">Paid Leave</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={record.note || ""}
                        onChange={(e) =>
                          handleNoteChange(employee.id, e.target.value)
                        }
                        placeholder="Add note (optional)"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleSave(employee.id)}
                        disabled={saving || !record.status}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && employees.length > 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">
              No employees match your search
            </p>
          </div>
        )}

        {employees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No active employees found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceSheet;
