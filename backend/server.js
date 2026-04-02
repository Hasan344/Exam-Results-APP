const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API çalışıyor 🚀");
});

// ROUTES
const subjectsRoutes = require("./subjects");
const studentsRoutes = require("./students");
const appealRoutes = require("./appeal");
const authRoutes = require("./auth");

app.use("/subjects", subjectsRoutes);
app.use("/students", studentsRoutes);
app.use("/appeal", appealRoutes);
app.use("/auth", authRoutes);

// server başlat
app.listen(5000, () => {
  console.log("Server 5000 portunda çalışıyor 🚀");
});