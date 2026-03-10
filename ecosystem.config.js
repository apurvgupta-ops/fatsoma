module.exports = {
    apps: [
        {
            name: 'api',
            cwd: './apps/api',
            script: 'npm',
            args: 'run dev',
            env: {
                NODE_ENV: 'development',
                PORT: 3016
            },
            watch: false,
            autorestart: true
        },
        {
            name: 'admin',
            cwd: './apps/admin',
            script: 'npm',
            args: 'run dev',
            env: {
                NODE_ENV: 'development',
                PORT: 3003
            },
            watch: false,
            autorestart: true
        },
        {
            name: 'web',
            cwd: './apps/web',
            script: 'npm',
            args: 'run dev',
            env: {
                NODE_ENV: 'development',
                PORT: 3001
            },
            watch: false,
            autorestart: true
        }
    ]
};
