const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
const ipCIDRCalculator = require('./server/server');
const path = require('path');

const app = express();

require('dotenv').config();

const corsOptions = {
  origin: "*",
  credentials: true,
  methods: ["POST"],
};

app.use(cors(corsOptions));

app.use(express.json());
// app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/ip-cidr-calculator');
});

app.get('/ip-cidr-calculator', async (req, res) => {
    res.render('pages/ip', {
        layout: false, 
        title: 'IP CIDR Calculator'
    });
});

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

// app.listen(process.env.PORT, () => {
//   console.log(`Server(${process.env.APP_NAME || ''}) running at http://localhost:${process.env.PORT}`);
// });

if (require.main === module) {
    app.listen(process.env.PORT || 3000, () => console.log(`Running locally on port ${process.env.PORT || 3000}`));
}

module.exports = app;
