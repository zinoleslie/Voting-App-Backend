const express = require("express");
const Router = express.Router();
const {authMiddleware} = require('../Middleware/authMiddleware')
const {addCandidate, getCandidate, voteCandidate} = require('../controllers/CandidateController');

Router.post('/add/candidate', authMiddleware, addCandidate);
Router.get('/get/allCandidate/:id', authMiddleware, getCandidate);
Router.patch('/voteCandidate/:id', authMiddleware, voteCandidate)


module.exports = Router