/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mirayfashions.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};
