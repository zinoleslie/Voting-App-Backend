const express  = require("express");
const Router = express.Router();
const {createElection, getElections, getSingleElection, getAllCandidate, electionVoters, updateElection, deleteElection} = require("../controllers/ElectionController")
const {authMiddleware} = require('../Middleware/authMiddleware')

Router.post('/createElection', authMiddleware, createElection);
Router.get('/getElections', authMiddleware, getElections);
Router.get('/getsingleElection/:id',authMiddleware, getSingleElection);
Router.get('/getAllCandidate/:id', authMiddleware, getAllCandidate);
Router.get('/election/voter/:id', authMiddleware, electionVoters);
Router.patch('/edit/election/:id', authMiddleware, updateElection);
Router.delete('/delete/election/:id', authMiddleware, deleteElection)



module.exports = Router