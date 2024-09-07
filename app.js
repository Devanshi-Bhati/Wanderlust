if(process.env.NODE_ENV !="production"){
    require("dotenv").config();
}

let express = require("express");
let app = express();
let mongoose = require("mongoose");
const path = require("path");
const Listing = require("./models/listing.js"); 
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL;
main()
.then((res)=>{
    console.log(res);
})
.catch((err)=>{
    console.log(err);
});

 async function main(){
 await mongoose.connect(dbUrl);
 
}
let port = 8080;
app.listen(port,()=>{
    console.log(`Server is listening on port ${port} `);
});
app.set("views",path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));


const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto:{
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});
store.on("error",()=>{
    console.log("ERROR IN MONGO SESSION STORE", err);
});
const sessionOptions = {
    secret: process.env.SECRET,
    store,
    resave: false,
    saveUnitialized: true,
    cookie:{
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next)=>{
res.locals.success = req.flash("success");
res.locals.error = req.flash("error");
res.locals.currUser = req.user;
next();
});

// app.get("/demouser",async (req, res)=>{
//     let fakeUser = new User({
//         email:"student@gmail.com",
//         username: "delta-student",
//     });
//     let registeredUser = await User.register(fakeUser, "helloworld");
//     res.send(registeredUser);
// });

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all("*",(req, res, next)=>{
    next(new ExpressError(404,"Page Not Found!"));
});
app.use((err, req, res, next)=>{
   let {statusCode=500, message="Something went wrong!"} = err;
   res.status(statusCode).render("error.ejs",{message});
});