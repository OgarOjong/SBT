const mongoose = require("mongoose");
require("dotenv").config();
const MONGODB_URI  = `mongodb://127.0.0.1:27017/yelp-camp`;
const Campground = require("../model/campround");
const cities = require("./city");
const {descriptors,places} = require("./seedHelpers");

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

const sample = (array) =>{
    const res = array[Math.floor(Math.random() * array.length)];
    //console.log(res);
    return res;
}


console.log(sample(descriptors));


const seedData = async ()=>{
 const deletedItems = await  Campground.deleteMany();
 console.log(deletedItems);
 
 for(let i =0; i<50; i++){
    const random1000 = Math.floor(Math.random()*1000)
    //console.log(random1000);
    const price = Math.floor(Math.random()* 20) +10;
    const camp = new Campground({
    location:`${cities[random1000].city}, ${cities[random1000].state}`,
    title:`${sample(descriptors)}, ${sample(places)}`,
    image:'https://source.unsplash.com/collection/300*300/483251',
    price,
    description:'Lorem ipsum dolor sit. Maiores excepturi,possimus officiis corporis placeat quisquam, nulla non eius veritatis quo veniam eaque ullam corrupti recusandae.'
    });
   await camp.save();

 }

}

seedData().then(()=>{
    mongoose.connection.close();
    console.log("connection closed");
});