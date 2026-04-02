module.exports = {
  apps: [
    {
      name: "api",
      cwd: "./api.onthelistapp.co.uk",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 3016,
        HOST: "0.0.0.0",
      },
      watch: false,
      autorestart: true,
    },
    {
      name: "admin",
      cwd: "./admin.onthelistapp.co.uk",
      script: "./node_modules/.bin/next",
      args: "start --hostname 0.0.0.0 --port 3018",
      env: {
        NODE_ENV: "production",
        PORT: 3018,
        HOSTNAME: "0.0.0.0",
      },
      watch: false,
      autorestart: true,
    },
    {
      name: "web",
      cwd: "./web",
      script: "./node_modules/.bin/next",
      args: "start --hostname 0.0.0.0 --port 3017",
      env: {
        NODE_ENV: "production",
        PORT: 3017,
        HOSTNAME: "0.0.0.0",
      },
      watch: false,
      autorestart: true,
    },
  ],
};
