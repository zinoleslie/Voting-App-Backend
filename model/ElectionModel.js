const mongoose = require('mongoose');
const Candidate = require('./CandidateModel');
const Schema = mongoose.Schema;
const Types = mongoose.Types

const ElectionSchema = new Schema({
    Title:{type: String, required: true},
    Description:{type: String, required: true},
    thumbnail:{type: String, required: true},
    Candidates:[{type: Types.ObjectId, ref:"Candidate", required: true}],
    Voters:[{type: Types.ObjectId, ref:"Voter", required: true}],
})

module.exports = mongoose.model('Election', ElectionSchema);