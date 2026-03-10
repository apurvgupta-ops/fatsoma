module.exports = {
    apps: [
        {
            name: 'api',
            cwd: './apps/api',
            script: 'dist/index.js',
            env: {
                NODE_ENV: 'production',
                PORT: 3016
            },
            watch: false,
            autorestart: true
        },
        {
            name: 'admin',
            cwd: './apps/admin',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            watch: false,
            autorestart: true
        },
        {
            name: 'web',
            cwd: './apps/web',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            },
            watch: false,
            autorestart: true
        }
    ]
};