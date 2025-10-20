const express = require('express');
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const expressLayouts = require("express-ejs-layouts")

dotenv.config();
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

// set ejs template
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout")
app.set("views", path.join(__dirname, "views"));

// user middlware
// app.use((req, res, next) => {
//   res.locals.user = req.user || null;
//   res.locals.active = ""; 
//   next();
// });

// app.use((req, res, next) => {
//   res.locals.user = req.user || null;  // ✅ always available
//   next();
// });

app.use((req, res, next) => {
  res.locals.user = req.user || null; // if using auth middleware to set req.user
  res.locals.active = res.locals.active || '';
  next();
});

//API routes
const landingRoutes = require("./routes/landingRoutes")
app.use("/", landingRoutes)


const authRoutes = require("./routes/authRoutes")
app.use("/auth", authRoutes)

const superAdminRoutes = require("./routes/superAdminRoutes")
app.use("/superadmin", superAdminRoutes)

const adminRoutes = require("./routes/adminRoutes")
app.use("/admin", adminRoutes)

const workerRoutes = require("./routes/workerRoutes")
app.use("/worker", workerRoutes)

const customerRoutes = require("./routes/customerRoutes")
app.use("/customer", customerRoutes)



// MongoDB connection
const connectDB = require("./config/db");
connectDB();



const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
});

