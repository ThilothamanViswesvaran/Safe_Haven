const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Serve JSON files
app.get("/trichy_crime_lat_long.json", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "trichy_crime_lat_long.json"));
});

app.get("/trichy_police_lat_long.json", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "trichy_police_lat_long.json"));
});

app.get("/trichy_cost_of_living.json", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "trichy_cost_of_living.json"));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
