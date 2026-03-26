"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, ArrowLeft, Key, Package } from "lucide-react";
import axios from "axios";

export default function ResetPassword() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const router = useRouter();

    useEffect(() => {
        // Get email and OTP from sessionStorage
        const storedEmail = sessionStorage.getItem("reset_email");
        const storedOtp = sessionStorage.getItem("reset_otp");

        if (!storedEmail || !storedOtp) {
            router.push("/forgot-password");
            return;
        }

        setEmail(storedEmail);
        setOtp(storedOtp);
    }, [router]);

    const validateForm = () => {
        if (!newPassword) {
            setError("New password is required");
            return false;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long");
            return false;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setError("");

        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/reset-password/`,
                {
                    email,
                    otp,
                    new_password: newPassword,
                    confirm_password: confirmPassword,
                }
            );

            // Clear session storage
            sessionStorage.removeItem("reset_email");
            sessionStorage.removeItem("reset_otp");

            // Show success message
            window.dispatchEvent(
                new CustomEvent("showToast", {
                    detail: {
                        message: "Password reset successfully! Please login with your new password.",
                        type: "success",
                    },
                })
            );

            // Redirect to login
            router.push("/login");
        } catch (err) {
            setError(err.response?.data?.error || "Failed to reset password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!email || !otp) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div className="text-center">
                        <div className="bg-gradient-to-r from-[#002147] to-[#7F56D9] p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Key className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="mt-2 text-2xl font-bold text-gray-900">
                            Reset Password
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Enter your new password below
                        </p>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        placeholder="Enter new password"
                                        className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        placeholder="Confirm new password"
                                        className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
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
                                        Resetting...
                                    </>
                                ) : (
                                    "Reset Password"
                                )}
                            </button>
                        </div>

                        <div className="text-center">
                            <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

