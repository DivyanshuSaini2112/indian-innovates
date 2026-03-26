import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },  // Google profile images
      { protocol: "https", hostname: "avatars.githubusercontent.com" },  // GitHub avatars
    ],
  },
  async redirects() {
    return [
      // The public/screens HTML files are now superseded by the proper Next.js app
      { source: "/screens/splash.html",      destination: "/",           permanent: false },
      { source: "/screens/login.html",       destination: "/login",      permanent: false },
      { source: "/screens/register.html",    destination: "/register",   permanent: false },
      { source: "/screens/dashboard.html",   destination: "/dashboard",  permanent: false },
      { source: "/screens/map.html",         destination: "/map",        permanent: false },
      { source: "/screens/alerts.html",      destination: "/alerts",     permanent: false },
      { source: "/screens/reports.html",     destination: "/reports",    permanent: false },
      { source: "/screens/profile.html",     destination: "/profile",    permanent: false },
      { source: "/screens/settings.html",    destination: "/settings",   permanent: false },
      { source: "/screens/my-districts.html",destination: "/my-districts", permanent: false },
    ];
  },
};

export default nextConfig;
