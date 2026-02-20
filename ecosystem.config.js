module.exports = {
  apps: [
    {
      name: "next-app",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./", // current working directory
      env: {
        NODE_ENV: "production",
        PORT: 4486,
        AUTH_TRUST_HOST: true,
      },
    },
  ],
};
