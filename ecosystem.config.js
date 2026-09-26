module.exports = {
    apps: [
      {
        name: '6ab6c4470002c467cfe3b0f7--server',
        script: 'npm',
      interpreter: "/usr/local/bin/icod-sandbox-run",
      interpreter_args: ["/app/data/projects/6ab6c4470002c467cfe3b0f7"],
        args: 'start',
        cwd: './server',
        instances: 1,
        exec_mode: 'fork',
        autorestart: true,
        watch: false,
        time: true,
        max_memory_restart: '500M',
        exp_backoff_restart_delay: 100,
        min_uptime: 3000,
        max_restarts: 10,

      },
      {
        name: '6ab6c4470002c467cfe3b0f7--client',
        script: 'npm',
      interpreter: "/usr/local/bin/icod-sandbox-run",
      interpreter_args: ["/app/data/projects/6ab6c4470002c467cfe3b0f7"],
        args: 'start',
        cwd: './client',
        instances: 1,
        exec_mode: 'fork',
        autorestart: true,
        watch: false,
        time: true,
        max_memory_restart: '500M',
        exp_backoff_restart_delay: 100,
        min_uptime: 3000,
        max_restarts: 10,

      }
    ]
  };