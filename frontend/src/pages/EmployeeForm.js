import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import DefaultAvatar from "../components/DefaultAvatar";

const EmployeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    aadharNumber: "",
    panNumber: "",
    address: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountName: "",
    currentSalary: "",
    type: "",
    bonus: "",
    status: "active",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchEmployee = async () => {
    try {
      const res = await axios.get(`/api/employees/${id}`);
      const employee = res.data.data;
      setFormData({
        fullName: employee.fullName,
        mobileNumber: employee.mobileNumber,
        aadharNumber: employee.aadharNumber,
        panNumber: employee.panNumber,
        address: employee.address,
        bankAccountNumber: employee.bankAccountNumber,
        bankIfscCode: employee.bankIfscCode,
        bankAccountName: employee.bankAccountName,
        currentSalary: employee.currentSalary,
        type: employee.type,
        bonus: employee.bonus || "",
        status: employee.status,
      });
      if (employee.photo) {
        setPhotoPreview(`/uploads/${employee.photo}`);
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
      setError("Failed to load employee data");
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchEmployee();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto-uppercase for PAN and IFSC
    if (name === "panNumber" || name === "bankIfscCode") {
      setFormData({ ...formData, [name]: value.toUpperCase() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validations
    if (!/^\d{12}$/.test(formData.aadharNumber)) {
      setError("Aadhar number must be exactly 12 digits");
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      setError("Mobile number must be exactly 10 digits");
      setLoading(false);
      return;
    }

    if (
      formData.panNumber &&
      !/^[A-Z]{5}\d{4}[A-Z]$/.test(formData.panNumber.toUpperCase())
    ) {
      setError("PAN number must be in format: ABCDE1234F");
      setLoading(false);
      return;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bankIfscCode.toUpperCase())) {
      setError("IFSC code must be valid (e.g., SBIN0001234)");
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        // Convert empty bonus to 0
        if (key === "bonus" && formData[key] === "") {
          submitData.append(key, "0");
        } else {
          submitData.append(key, formData[key]);
        }
      });
      if (photo) {
        submitData.append("photo", photo);
      }

      if (isEditMode) {
        await axios.put(`/api/employees/${id}`, submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post("/api/employees", submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      navigate("/employees");
    } catch (error) {
      console.error("Error saving employee:", error);
      setError(error.response?.data?.message || "Failed to save employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate("/employees")}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Employees
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? "Edit Employee" : "Add New Employee"}
          </h2>
        </div>

        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Photo
            </label>
            <div className="flex items-center space-x-4">
              {photoPreview && !photoPreview.includes("default-avatar.png") ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <DefaultAvatar className="h-24 w-24 rounded-full" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="text"
                name="mobileNumber"
                required
                maxLength="10"
                pattern="\d{10}"
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="9876543210"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                10-digit mobile number
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                name="type"
                required
                value={formData.type}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Role</option>
                <option value="TM Driver">TM Driver</option>
                <option value="TM Helper">TM Helper</option>
                <option value="Plant Operator">Plant Operator</option>
                <option value="Loader Operator">Loader Operator</option>
                <option value="Quality In charge">Quality In charge</option>
                <option value="Lab Helper">Lab Helper</option>
                <option value="Plant Helper">Plant Helper</option>
                <option value="Dispatch Manager">Dispatch Manager</option>
                <option value="Accountant">Accountant</option>
                <option value="Plant Manager">Plant Manager</option>
                <option value="Pump supervisor">Pump supervisor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aadhar Number *
              </label>
              <input
                type="text"
                name="aadharNumber"
                required
                maxLength="12"
                pattern="\d{12}"
                value={formData.aadharNumber}
                onChange={handleChange}
                placeholder="123456789012"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                12-digit Aadhar number
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                name="panNumber"
                maxLength="10"
                pattern="[A-Z]{5}\d{4}[A-Z]"
                value={formData.panNumber}
                onChange={handleChange}
                placeholder="ABCDE1234F (Optional)"
                style={{ textTransform: "uppercase" }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Format: ABCDE1234F (Optional)
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Account Number *
              </label>
              <input
                type="text"
                name="bankAccountNumber"
                required
                value={formData.bankAccountNumber}
                onChange={handleChange}
                placeholder="1234567890123456"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IFSC Code *
              </label>
              <input
                type="text"
                name="bankIfscCode"
                required
                maxLength="11"
                pattern="[A-Z]{4}0[A-Z0-9]{6}"
                value={formData.bankIfscCode}
                onChange={handleChange}
                placeholder="SBIN0001234"
                style={{ textTransform: "uppercase" }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">Bank IFSC code</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder Name *
              </label>
              <input
                type="text"
                name="bankAccountName"
                required
                value={formData.bankAccountName}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                name="address"
                required
                rows="3"
                value={formData.address}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Salary (₹) *
              </label>
              <input
                type="number"
                name="currentSalary"
                required
                min="0"
                value={formData.currentSalary}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bonus (₹)
              </label>
              <input
                type="number"
                name="bonus"
                min="0"
                value={formData.bonus}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate("/employees")}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : isEditMode
                ? "Update Employee"
                : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
