const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOveride = require("method-override");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");
const helmet = require("helmet");
//const https = require("https");
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require("dotenv").config();
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const Joi = require("joi");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./model/user");
//const memoryStore = new session.MemoryStore();
const app = express();
const port = process.env.PRODPORT || 3001;
const { json } = require("express");
const redis = require("redis");
const Redis = require("ioredis");
const RedisStore = require("connect-redis").default;
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(methodOveride("_method"));
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
/*app.use(
	helmet({
		contentSecurityPolicy: {
			useDefaults: true,
			directives: {
				defaultSrc: ["'self'"]
				"script-src": [
					"'self'",
					"'unsafe-inline'", "'unsafe-eval'"
					"https://cdn.jsdelivr.net",
					"https://cdnjs.cloudflare.com",
					"https://ajax.googleapis.com",
					"https://cdn.datatables.net",
					"https://fonts.googleapis.com",
					"https://stackpath.bootstrapcdn.com",
				],
				"img-src": [
					"'self'",
					"https://cdn-icons-png.flaticon.com",
					"https://res.cloudinary.com",
					"https://www.spectranet.com.ng/",
				],
				defaultSrc: ["'self'"],
				"style-src": [
					"'self'",
					"'unsafe-inline'",
					"https://cdn.jsdelivr.net",
					"https://cdnjs.cloudflare.com",
					"https://cdn.datatables.net",
					"unsafe-inline",
					"unsafe-eval",
				],
				//	"font-src": ["'self'", "https://fonts.googleapis.com",],
			},
		},
	})
); */
app.use(express.static(path.join(__dirname, "public")));
const loggerMiddleware = (req, res, next) => {
	console.log(`${new Date()} ---Request [${req.method}] [${req.url}]`);
	next();
};

const redisClient = new Redis();
const sessionConfig = {
	secret: "thisshouldbeasecret",
	resave: false,
	saveUninitialized: true,
	cookie: {
		httpOnly: true, //ensure that they can only be accessed by the server and are not accessible to client-side scripts
		// expires: Date.now() + 1000000 * 60 * 60 * 24 * 7,
		maxAge: 60 * 60 * 1000, // 1000000 * 60 * 60 * 24 * 7,
	},
	store: new RedisStore({ client: redisClient }),
};

var cpuCount = require("os").cpus().length;
console.log("CPU count", cpuCount);
app.set("trust proxy", true);
app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(
	new localStrategy(
		{
			usernameField: "email", // Specify the field for the username (email)
			passwordField: "password", // Specify the field for the password
		},
		User.authenticate()
	)
);
app.use((req, res, next) => {
	//console.log(memoryStore);
	res.locals.currentUser = req.user;
	next();
});
//passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const uploaderRoute = require("./routes/uploader");
const jaraRoute = require("./routes/jaraRoute");
const userRoutes = require("./routes/users");

const MONGODB_URI = `mongodb://127.0.0.1:${process.env.DBport}/financesApp`;
mongoose
	.connect(MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log(`Database Connection Established on port`);
	})
	.catch((err) => {
		console.log(`Connection Error`);
		console.log(err);
	});

app.use((req, res, next) => {
	//console.log(req.session);
	res.locals.currentUser = req.user;
	res.locals.success = req.flash("success");
	res.locals.error = req.flash("error");
	next();
});
app.use(loggerMiddleware);
app.use("/uploader", uploaderRoute);
app.use("/users", userRoutes);
app.use("/jara", jaraRoute);

app.all("*", (req, res, next) => {
	next(new ExpressError("PAGE NOT FOUND!!", 404));
});

app.use((err, req, res, next) => {
	console.error("Error middleware:", err);
	const { message = "Something Went Wrong!!", statusCode = 500 } = err;
	if (!err.message) err.message = "Oh no something went wrong";
	res.status(statusCode).render("error", { err });
});

app.listen(port, () => {
	console.log(`Server started  on port: ${port}`);
});
