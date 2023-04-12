const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOveride = require("method-override");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");
require("dotenv").config();

const app = express();
const Campground = require("./model/campround");
const { json } = require("express");

app.engine('ejs',ejsMate)
app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,'views'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOveride("_method"));
app.use(morgan('dev'));

const MONGODB_URI  = `mongodb://127.0.0.1:${process.env.DBport}/yelp-camp`;
mongoose.connect(MONGODB_URI,
{
    useNewUrlParser:true, 
    useUnifiedTopology:true
})
.then(()=>{
    console.log(`Database Connection Established on port`);
}).catch((err)=>{
    console.log(`Connection Error`);
    console.log(err);
});


app.get("/",(req,res)=>{
    res.render("home")
});

app.get("/campgrounds", async(req,res)=>{
    try {
    const campgrounds = await Campground.find({});
    res.render("campground/index",{campgrounds});
        
    } catch (error) {
        console.log("From Show Route");
        console.log(error);
    }
    
  // res.status(200).send(campgrounds);
});

app.get("/campgrounds/new", (req,res)=>{
    res.render("campground/new");
});

app.post("/campgrounds",async (req,res)=>{
    const camp = new Campground(req.body.campground);
    await camp.save();
    res.redirect(`campgrounds/${camp._id}`);
})

app.get("/campgrounds/:id", async(req,res)=>{
    try {
        const {id} = req.params;
        // console.log(id);
         const campground = await Campground.findById(id);
        // console.log(campground);
        res.render("campground/show",{campground});
        
    } catch (error) {
        console.log("From ID route");
        console.log(error)
    }
   
});

app.get("/campgrounds/:id/edit", async(req,res)=>{
    try {
        const {id} = req.params;
        // console.log(id);
         const campground = await Campground.findById(id);
        // console.log(campground);
        res.render("campground/edit",{campground});
        
    } catch (error) {
        console.log("From ID route");
        console.log(error)
    }
   
});

app.put("/campgrounds/:id",async (req,res)=>{
    const {id} = req.params;
    const updateCamp = await Campground.findByIdAndUpdate(id,{...req.body.campground},{new:true});
    console.log({...req.body.campground})
    console.log(updateCamp);
    res.redirect(`/campgrounds/${updateCamp._id}`);
   //res.send("IT WORKED")
});

app.delete("/campgrounds/:id", async(req,res)=>{
    const {id} = req.params;
    console.log(id);
    const deletedCamp = await Campground.findByIdAndDelete(id);
    console.log(deletedCamp)
    res.redirect(`/campgrounds`);
});

app.use((req,res)=>{
    res.status(404).send("NOT FOUND")
})


app.listen(3002, ()=>{
    console.log(`Servin on port 3002`)
})

