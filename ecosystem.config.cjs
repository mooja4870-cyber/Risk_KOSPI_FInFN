module.exports = {
  apps: [
    {
      name: "risk-kospi-scheduler",
      script: "python",
      args: "-u scripts/scheduler.py",
      interpreter: "none",
      env: {
        PYTHONPATH: "."
      },
      autorestart: true,
      max_memory_restart: "500M",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    },
    {
      name: "risk-kospi-backend",
      script: "python",
      args: "-m streamlit run streamlit_app.py --server.port 8501 --server.address 0.0.0.0",
      interpreter: "none",
      env: {
        PYTHONPATH: "."
      }
    },
    {
      name: "risk-kospi-frontend-dev",
      script: "npm",
      args: "run dev",
      env: {
        PORT: 5173
      }
    }
  ]
};
