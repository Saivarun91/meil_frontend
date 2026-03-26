"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, Key, Package } from "lucide-react";
import axios from "axios";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1); // 1: email, 2: OTP verification
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        if (!email) {
            setError("Email is required");
            return;
        }

        setIsLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/forgot-password/`,
                { email }
            );
            setMessage(res.data.message || "OTP sent to your email");
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to send OTP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!otp) {
            setError("OTP is required");
            return;
        }

        setIsLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/verify-password-reset-otp/`,
                { email, otp }
            );
            // Store email and OTP for password reset page
            sessionStorage.setItem("reset_email", email);
            sessionStorage.setItem("reset_otp", otp);
            router.push("/reset-password");
        } catch (err) {
            setError(err.response?.data?.error || "Invalid OTP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div className="text-center">
                        <div className="bg-gradient-to-r from-[#002147] to-[#7F56D9] p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Key className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="mt-2 text-2xl font-bold text-gray-900">
                            {step === 1 ? "Forgot Password?" : "Verify OTP"}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {step === 1
                                ? "Enter your email address and we'll send you an OTP to reset your password"
                                : "Enter the OTP sent to your email"}
                        </p>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-600">{message}</p>
                        </div>
                    )}

                    {step === 1 ? (
                        <form className="mt-8 space-y-6" onSubmit={handleRequestOTP}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder="Enter your email"
                                        className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
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
                                            Sending OTP...
                                        </>
                                    ) : (
                                        "Send OTP"
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
                    ) : (
                        <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                                    Enter OTP
                                </label>
                                <input
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    maxLength={6}
                                    required
                                    placeholder="Enter 6-digit OTP"
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                />
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
                                            Verifying...
                                        </>
                                    ) : (
                                        "Verify OTP"
                                    )}
                                </button>
                            </div>

                            <div className="text-center space-y-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep(1);
                                        setOtp("");
                                        setError("");
                                        setMessage("");
                                    }}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Resend OTP
                                </button>
                                <div>
                                    <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center">
                                        <ArrowLeft className="w-4 h-4 mr-1" />
                                        Back to Login
                                    </Link>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

