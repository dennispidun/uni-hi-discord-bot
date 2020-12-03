module.exports = {
    apps: [
        {
            name: 'unibot',
            script: '/home/unibot/build/index.js',
            time: true,
            instances: 1,
            autorestart: true,
            max_restarts: 50,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: "production",
                DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
                UNI_USERNAME: process.env.UNI_USERNAME,
                UNI_PASSWORD: process.env.UNI_PASSWORD,
                SESSION_COOKIE: process.env.SESSION_COOKIE,
                DBX_TOKEN: process.env.DBX_TOKEN,
                UNI_FS_MAIL: process.env.UNI_FS_MAIL,
                UNI_FS_PASSWORD: process.env.UNI_FS_PASSWORD
            }
        },
    ],
    deploy: {
        production: {
            user: process.env.DEPLOY_PM2_USER,
            host: process.env.DEPLOY_PM2_HOST,
            key: 'deploy.key',
            ref: 'origin/main',
            repo: 'https://github.com/dennispidun/uni-hi-discord-bot',
            path: '/home/unibot',
            'post-deploy':
            'pwd && npm i && npm run build && pm2 restart /home/unibot/src/ecosystem.config.js --env production && pm2 save',
            env: {
            NODE_ENV: 'production',
            DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
            UNI_USERNAME: process.env.UNI_USERNAME,
            UNI_PASSWORD: process.env.UNI_PASSWORD,
            SESSION_COOKIE: process.env.SESSION_COOKIE,
            DBX_TOKEN: process.env.DBX_TOKEN,
            UNI_FS_MAIL: process.env.UNI_FS_MAIL,
            UNI_FS_PASSWORD: process.env.UNI_FS_PASSWORD
            },
        },
    },
}