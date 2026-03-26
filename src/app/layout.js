// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toast } from "@/components/Toast";
import { AuthProvider } from "@/context/AuthContext";


const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "MDM Portal - Material Data Management",
  description: "Advanced Material Data Management Portal with AI-powered governance",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground`}>

        <AuthProvider>

          {children}
          <Toast />
        </AuthProvider>
      </body>
    </html>
  );
}
