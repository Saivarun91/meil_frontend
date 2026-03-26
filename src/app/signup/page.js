"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Package, Building, RefreshCw } from "lucide-react";
import SearchableDropdown from "@/components/SearchableDropdown";

export default function Signup() {
    const [formData, setFormData] = useState({
        emp_name: "",
        email: "",
        ph_number: "",
        designation: "",
        password: "",
        confirmPassword: "",
        company_name: "",
        description: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);

    // Load companies on component mount
    useEffect(() => {
        const loadCompanies = async () => {
            setLoadingCompanies(true);
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/company/companies/public/`);
                if (res.data) {
                    setCompanies(res.data || []);
                }
            } catch (err) {
                console.error("Error loading companies:", err);
                // Don't show error to user, just log it
            } finally {
                setLoadingCompanies(false);
            }
        };
        loadCompanies();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.emp_name) newErrors.emp_name = "Full name is required";
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }
        if (!formData.ph_number) newErrors.ph_number = "Phone number is required";
        if (!formData.designation) newErrors.designation = "Designation is required";
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }
        if (!formData.company_name) newErrors.company_name = "Company name is required";
        if (!formData.description) newErrors.description = "Description is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/register/`, {
                emp_name: formData.emp_name,
                email: formData.email,
                ph_number: formData.ph_number,
                designation: formData.designation,
                password: formData.password,
                company_name: formData.company_name,
                description: formData.description,
            });

            const event = new CustomEvent("showToast", {
                detail: { message: "Account created! Please verify your email.", type: "success" },
            });
            window.dispatchEvent(event);

            setShowOtpModal(true); // open modal
        } catch (error) {
            const event = new CustomEvent("showToast", {
                detail: { message: error.response?.data?.error || "Signup failed. Try again.", type: "error" },
            });
            window.dispatchEvent(event);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async () => {
        if (!otp) return;
        setOtpLoading(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/verify_email_otp/`, {
                email: formData.email,
                otp: otp,
            });

            const event = new CustomEvent("showToast", {
                detail: { message: "Email verified successfully! Redirecting...", type: "success" },
            });
            window.dispatchEvent(event);

            setTimeout(() => {
                window.location.href = "/";
            }, 1500);
        } catch (error) {
            const event = new CustomEvent("showToast", {
                detail: { message: error.response?.data?.error || "Invalid OTP. Try again.", type: "error" },
            });
            window.dispatchEvent(event);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResendLoading(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/resend-otp/`, {
                email: formData.email,
            });

            const event = new CustomEvent("showToast", {
                detail: { message: "OTP resent to your email.", type: "success" },
            });
            window.dispatchEvent(event);
        } catch (error) {
            const event = new CustomEvent("showToast", {
                detail: { message: error.response?.data?.error || "Failed to resend OTP.", type: "error" },
            });
            window.dispatchEvent(event);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div className="flex justify-center mb-2">
                        <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
                            <ArrowLeft size={16} className="mr-1" />
                            Back to home
                        </Link>
                    </div>

                    <div className="text-center">
                        <div className="bg-gradient-to-r from-[#002147] to-[#7F56D9] p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Package className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="mt-2 text-2xl font-bold text-gray-900">Join Megha Materials Hub</h2>
                        <p className="mt-2 text-sm text-gray-600">Create your account to access our material management system</p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        name="emp_name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${errors.emp_name ? "border-red-300" : "border-gray-300"} rounded-lg`}
                                        value={formData.emp_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                {errors.emp_name && <p className="mt-1 text-sm text-red-600">{errors.emp_name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${errors.email ? "border-red-300" : "border-gray-300"} rounded-lg`}
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    name="ph_number"
                                    type="text"
                                    placeholder="Enter your phone number"
                                    className={`appearance-none relative block w-full pl-3 pr-3 py-3 border ${errors.ph_number ? "border-red-300" : "border-gray-300"} rounded-lg`}
                                    value={formData.ph_number}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Designation */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                <input
                                    name="designation"
                                    type="text"
                                    placeholder="Enter your designation"
                                    className={`appearance-none relative block w-full pl-3 pr-3 py-3 border ${errors.designation ? "border-red-300" : "border-gray-300"} rounded-lg`}
                                    value={formData.designation}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a password"
                                        className={`appearance-none relative block w-full pl-10 pr-10 py-3 border ${errors.password ? "border-red-300" : "border-gray-300"} rounded-lg`}
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm your password"
                                        className={`appearance-none relative block w-full pl-10 pr-10 py-3 border ${errors.confirmPassword ? "border-red-300" : "border-gray-300"} rounded-lg`}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                    <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                            </div>

                            {/* Company Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                                {loadingCompanies ? (
                                    <div className="text-sm text-gray-500 py-3">Loading companies...</div>
                                ) : (
                                    <>
                                        {companies.length > 0 && (
                                            <div className="mb-2">
                                                <SearchableDropdown
                                                    options={companies}
                                                    value={formData.company_name}
                                                    onChange={(value) => setFormData(prev => ({ ...prev, company_name: value || "" }))}
                                                    placeholder="Select a company..."
                                                    searchPlaceholder="Search companies..."
                                                    getOptionLabel={(option) => {
                                                        if (typeof option === 'string') return option;
                                                        return option.company_name || String(option);
                                                    }}
                                                    getOptionValue={(option) => {
                                                        if (typeof option === 'string') return option;
                                                        return option.company_name || option;
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                            <input
                                                name="company_name"
                                                type="text"
                                                placeholder={companies.length > 0 ? "Or enter a new company name" : "Enter your company name"}
                                                className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${errors.company_name ? "border-red-300" : "border-gray-300"} rounded-lg`}
                                                value={formData.company_name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </>
                                )}
                                {errors.company_name && <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>}
                                {companies.length > 0 && (
                                    <p className="mt-1 text-xs text-gray-500">Select from existing companies above or enter a new company name in the field below</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Enter a short description"
                                    className={`appearance-none relative block w-full px-3 py-3 border ${errors.description ? "border-red-300" : "border-gray-300"} rounded-lg`}
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#002147] to-[#7F56D9] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Creating account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* OTP Modal */}
            {showOtpModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
                        <h3 className="text-lg font-semibold mb-2 text-gray-800">Verify Email</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Enter the OTP sent to <span className="font-medium">{formData.email}</span>
                        </p>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter OTP"
                            className="w-full border rounded-lg px-3 py-2 mb-4"
                        />
                        <div className="flex justify-between items-center">
                            <button
                                onClick={handleResendOtp}
                                disabled={resendLoading}
                                className="flex items-center text-sm text-blue-600 hover:underline"
                            >
                                <RefreshCw size={14} className="mr-1" />
                                {resendLoading ? "Resending..." : "Resend OTP"}
                            </button>
                            <div className="space-x-2">
                                <button
                                    onClick={() => setShowOtpModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleOtpSubmit}
                                    disabled={otpLoading}
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {otpLoading ? "Verifying..." : "Verify"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
