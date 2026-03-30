module.exports = {
    apps: [
        {
            name: 'api',
            cwd: './apps/api',
            script: 'dist/index.js',
            env: {
                NODE_ENV: 'production',
                PORT: 3016,
                HOST: '0.0.0.0',
            },
            watch: false,
            autorestart: true,
        },
        {
            name: 'admin',
            cwd: './apps/admin',
            script: '../../node_modules/.bin/next',
            args: 'start --hostname 0.0.0.0 --port 3018',
            env: {
                NODE_ENV: 'production',
                PORT: 3018,
                HOSTNAME: '0.0.0.0',
            },
            watch: false,
            autorestart: true,
        },
        {
            name: 'web',
            cwd: './apps/web',
            script: '../../node_modules/.bin/next',
            args: 'start --hostname 0.0.0.0 --port 3017',
            env: {
                NODE_ENV: 'production',
                PORT: 3017,
                HOSTNAME: '0.0.0.0',
            },
            watch: false,
            autorestart: true,
        },
    ],
};