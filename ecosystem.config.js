module.exports = {
  apps: [
    {
      name: "next-app",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./", // current working directory
      watch: [],
      watch_options: {
        followSymlinks: true,
        interval: 1000,
        usePolling: true,
        recursive: true,
        ignoreInitial: true, // Don't trigger on initial scan
      },
      ignore_watch: ["node_modules", ".git"],
      env: {
        NODE_ENV: "production",
        PORT: 4486,
        AUTH_TRUST_HOST: true,
      },
    },
  ],
};
