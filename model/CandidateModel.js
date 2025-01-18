const mongoose = require('mongoose');
const Types = mongoose.Types
const Schema = mongoose.Schema

const CandidateSchema = new Schema({
    fullname :{type: String, required: true},
    image:{type: String, required:true},
    motto:{ type: String, required: true},
    voteCount:{type: Number, default:0},
    electionId:{type: Types.ObjectId, required: true, ref: "Election"}
})

module.exports = mongoose.model("Candidate", CandidateSchema)