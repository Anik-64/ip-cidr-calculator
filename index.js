const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
const ipCIDRCalculator = require('./server/server');

const app = express();

require('dotenv').config();

const corsOptions = {
  origin: "*",
  credentials: true,
  methods: ["POST"],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.static("public"));

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], 
        scriptSrc: [
          "'self'", 
          "https://cdn.tailwindcss.com"
        ],
        fontSrc: [
          "'self'", 
          "https://fonts.gstatic.com", 
        ],
        imgSrc: [
          "'self'", 
          "data:", 
          "https://firebasestorage.googleapis.com", 
        ],
        connectSrc: [
          "'self'", 
          "http://localhost:2723",
        ],
        frameSrc: [
          "'self'", 
        ],
        objectSrc: [
          "'none'", 
        ],
        baseUri: ["'self'"], 
        formAction: ["'self'"], 
      },
    },
  })
);

app.get("/healthcheck", (req, res) => {
  try {
    res.status(200).end();
  } catch (err) {
    res.status(503).end();
  }
});

app.use("/api/v1", ipCIDRCalculator);

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});
