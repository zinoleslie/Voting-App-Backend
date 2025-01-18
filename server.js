const express = require("express");
require('dotenv').config();
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
// create the mongodb connection
const DbURL = process.env.MongoDB_URL;
port = 5007;
//require the routes
const VotersRoutes = require('./Routes/VotersRoutes')
const ElectionRoutes = require("./Routes/ElectionRoutes")
const CandidateRoute = require("./Routes/CandiadateRoutes")
//bring in the uploads 
const upload = require("express-fileupload")






mongoose.connect(DbURL).then(() => {
    console.log("Connected to MongoDB successfully....");
    
    app.get("/", (req, res) => {
        res.send("Hello World");
    })

    //middleware
    app.use(express.json());
    app.use(cors());
    app.use(upload());

    //mount router
    app.use('/api', VotersRoutes)
    app.use('/api', ElectionRoutes)
    app.use('/api', CandidateRoute)

    app.listen(port, () => {
        console.log(`😎😍🧐 Server is running on port http://localhost:${port}`);
    })
}).catch((error)=>{
    console.log(error);
})