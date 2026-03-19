module.exports = {
  apps: [
    {
      name: "risk-kospi-backend",
      script: "python3.11",
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
