const express = require("express");
require('dotenv').config();
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
// create the mongodb connection
const DbURL = process.env.MongoDB_URL;
port = process.env.PORT || 5007;
//require the routes
const VotersRoutes = require('./Routes/VotersRoutes')
const ElectionRoutes = require("./Routes/ElectionRoutes")
const CandidateRoute = require("./Routes/CandiadateRoutes")
//bring in the uploads 
const upload = require("express-fileupload");
// const { loginVoter } = require("./controllers/VotersControllers");

const allowedOrigin = ["http://localhost:5173", 'https://votingapp-frontend-project.onrender.com']




mongoose.connect(DbURL).then(() => {
    console.log("Connected to MongoDB successfully....");

    //middleware

    app.use(cors({
        origin: allowedOrigin, // Allow requests only from your frontend
        credentials: true, // Allow credentials (cookies, auth headers)
        methods: "GET,POST,PATCH,DELETE", // Allowed HTTP methods
        allowedHeaders: "Content-Type,Authorization" // Allowed headers
    }));

    app.use(express.json());
    app.use(upload());

    app.get("/", (req, res) => {
        res.send("Hello World");
    })
    



    //mount router
    app.use('/api', VotersRoutes)
    app.use('/api', ElectionRoutes)
    app.use('/api', CandidateRoute)


    app.listen( port, '0.0.0.0', () => {
        console.log("Registered Routes:");
    app._router.stack.forEach((r) => {
        if (r.route) console.log(r.route.path, Object.keys(r.route.methods));
    });
        console.log(`😎😍🧐 Server is running on port http://localhost:${port}`);
    })
}).catch((error) => {
    console.log(error);
})