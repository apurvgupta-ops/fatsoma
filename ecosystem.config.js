module.exports = {
  apps: [
    {
      name: "next-app",
      script: "/",
      args: "start",
      cwd: "./", // current working directory
      env: {
        NODE_ENV: "production",
        PORT: 4486,
      },
    },
  ],
};
