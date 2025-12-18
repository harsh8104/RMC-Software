import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  PlusIcon,
  TrashIcon,
  BanknotesIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [filters, setFilters] = useState({
    employeeId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const [formData, setFormData] = useState({
    employeeId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    remarks: "",
  });

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("/api/employees?limit=1000&status=active");
      setEmployees(res.data.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        limit: 100,
      });
      const res = await axios.get(`/api/payments?${params}`);
      setPayments(res.data.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPayment) {
        await axios.put(`/api/payments/${editingPayment.id}`, formData);
        alert("Payment updated successfully!");
      } else {
        await axios.post("/api/payments", formData);
        alert("Payment added successfully!");
      }
      setShowModal(false);
      setEditingPayment(null);
      setFormData({
        employeeId: "",
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        remarks: "",
      });
      fetchPayments();
    } catch (error) {
      console.error("Error saving payment:", error);
      alert(error.response?.data?.message || "Failed to save payment");
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      employeeId: payment.employeeId,
      amount: payment.amount,
      paymentDate: new Date(payment.paymentDate).toISOString().split("T")[0],
      month: payment.month,
      year: payment.year,
      remarks: payment.remarks || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      try {
        await axios.delete(`/api/payments/${id}`);
        fetchPayments();
      } catch (error) {
        console.error("Error deleting payment:", error);
        alert("Failed to delete payment");
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const totalAmount = payments.reduce(
    (sum, payment) => sum + parseFloat(payment.amount),
    0
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Salary Payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track mid-month salary payments
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Payment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee
            </label>
            <select
              name="employeeId"
              value={filters.employeeId}
              onChange={handleFilterChange}
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
              Month
            </label>
            <select
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString("default", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-6">
        <div className="flex items-center">
          <BanknotesIcon className="h-12 w-12 text-white opacity-80" />
          <div className="ml-4">
            <p className="text-sm font-medium text-white opacity-90">
              Total Payments This Period
            </p>
            <p className="text-3xl font-bold text-white">
              ₹
              {totalAmount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-white opacity-75 mt-1">
              {payments.length} payment(s) recorded
            </p>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.employee?.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.employee?.aadharNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-primary-600">
                        ₹{parseFloat(payment.amount).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.year, payment.month - 1).toLocaleString(
                        "default",
                        { month: "short", year: "numeric" }
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {payment.remarks || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => handleEdit(payment)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit payment"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(payment.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete payment"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No payments found for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingPayment ? "Edit Payment" : "Add Payment"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPayment(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee *
                </label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleFormChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} - {emp.type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  required
                  min="1"
                  step="0.01"
                  placeholder="Enter amount"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleFormChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month *
                  </label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleFormChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => (
                        <option key={month} value={month}>
                          {new Date(2000, month - 1).toLocaleString("default", {
                            month: "long",
                          })}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleFormChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    {Array.from(
                      { length: 5 },
                      (_, i) => new Date().getFullYear() - 2 + i
                    ).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleFormChange}
                  placeholder="e.g., Advance, Partial Payment"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPayment(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600"
                >
                  {editingPayment ? "Update Payment" : "Add Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
