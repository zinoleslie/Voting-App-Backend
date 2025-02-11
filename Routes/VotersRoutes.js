const express = require('express');
const Router = express.Router()
const {CreateVoter, loginVoter, getVoter, allVoters} = require('../controllers/VotersControllers')
const {authMiddleware} = require('../Middleware/authMiddleware')

Router.post('/createVoter', CreateVoter);
Router.post('/loginVoter', loginVoter);
Router.get('/getVoter/:id',authMiddleware, getVoter);
Router.get('/get/allVoters',authMiddleware, allVoters)









module.exports = Router;