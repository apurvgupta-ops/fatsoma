module.exports = {
  apps: [
    {
      name: "api",
      cwd: "./api",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 3016,
      },
      watch: false,
      autorestart: true,
    },
    {
      name: "admin",
      cwd: "./admin",
      script: "./node_modules/.bin/next",
      args: "start --port 3018",
      env: {
        NODE_ENV: "production",
        PORT: 3018,
      },
      watch: false,
      autorestart: true,
    },
    {
      name: "web",
      cwd: "./web",
      script: "./node_modules/.bin/next",
      args: "start --port 3017",
      env: {
        NODE_ENV: "production",
        PORT: 3017,
      },
      watch: false,
      autorestart: true,
    },
  ],
};
