/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "meil.in",
            },
        ],
    },
};

export default nextConfig;
