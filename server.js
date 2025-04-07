require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

// Serve static files from the "public" directory (Create this folder and move your HTML, CSS, JS inside it)
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/google-maps-key", (req, res) => {
    res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
