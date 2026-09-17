require("dotenv").config();
const express = require("express");
const cors = require("cors");

const predictRoute = require("./routes/predict");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "smartevent-backend" });
});

// Proxies attendance-prediction requests to the Python/FastAPI ML service
app.use("/api/predict", predictRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SmartEvent backend running on http://localhost:${PORT}`);
});
