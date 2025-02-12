const ElectionModel = require("../model/ElectionModel");
const CandidateModel = require("../model/CandidateModel");
const VotersModel = require("../model/VotersModel");
const { v4: uuid } = require("uuid");
const mongoose = require("mongoose");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");






exports.addCandidate = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Only admins can add candidates" });
        }

        const { fullname, motto, electionId } = req.body;
        if (!fullname || !motto || !electionId) {
            return res.status(422).json({ message: "Please fill in all fields" });
        }

        if (!req.files || !req.files.image) {
            return res.status(422).json({ message: "Please provide an image" });
        }

        const { image } = req.files;

        if (image.size > 1000000) {
            return res.status(422).json({ message: "File too big. Must be less than 1MB" });
        }

        // Cloudinary upload via stream
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "image", folder: "candidates" },
            async (error, uploadResult) => {
                if (error || !uploadResult.secure_url) {
                    return res.status(500).json({ message: "Couldn't save image to Cloudinary", error });
                }

                const newCandidate = new CandidateModel({
                    fullname,
                    motto,
                    image: uploadResult.secure_url,
                    electionId: electionId,
                });

                const sess = await mongoose.startSession();
                sess.startTransaction();
                try {
                    await newCandidate.save({ session: sess });
                    let electionDoc = await ElectionModel.findById(electionId).session(sess);
                    electionDoc.Candidates.push(newCandidate);
                    await electionDoc.save({ session: sess });

                    await sess.commitTransaction();
                    res.status(201).json({ success: true, message: "Candidate added successfully", data: newCandidate });
                } catch (error) {
                    await sess.abortTransaction();
                    return res.status(500).json({ message: "Error adding candidate", error: error.message });
                } finally {
                    sess.endSession();
                }
            }
        );

        // Convert buffer to readable stream and pipe to Cloudinary
        streamifier.createReadStream(image.data).pipe(uploadStream);
    } catch (error) {
        res.status(500).json({ message: "Error creating candidate", error: error.message });
    }
};



//get candidate of an election.......
exports.getCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const candidates = await CandidateModel.findById(id)
        res.status(200).json({ message: "candidate fetched successfully", data: candidates })
    } catch (error) {
        res.status(500).json({ message: "failed to fetch candidate", error: error.message })
    }
}

//get all candidate.......
exports.allCandidates = async (req, res) => {
    try {
        const fetchedCandidates = await CandidateModel.find();
        res.status(200).json({ message: "succusful", data: fetchedCandidates })
    } catch (error) {
        res.status(500).json({ message: "failed to fetch all cancidates", error: error.message })
    }
}



//DELETE CANDIDATE........

exports.removeCandidate = async (req, res) => {
    // Ensuring only admins can access this action
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Only admins can perform this action" });
    }

    try {
        const { id } = req.params;

        // Find the candidate and populate the election it belongs to
        const currentElection = await CandidateModel.findById(id).populate('electionId');
        if (!currentElection) {
            return res.status(404).json({ message: "Candidate not found" });
        }

        // Start a session
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Remove candidate reference from the election's candidate list
            await ElectionModel.findByIdAndUpdate(
                currentElection.electionId._id,
                { $pull: { Candidates: id } }, // Removes the candidate from the array
                { new: true, session }
            );

            // Delete candidate from the database
            await CandidateModel.findByIdAndDelete(id, { session });

            // Commit transaction
            await session.commitTransaction();
            session.endSession();

            return res.status(200).json({ message: "Candidate deleted successfully" });
        } catch (error) {
            // Rollback transaction if anything fails
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

    } catch (error) {
        return res.status(500).json({ message: "Failed to delete candidate", error: error.message });
    }
};


// VOTE CANDIDATE
exports.voteCandidate = async (req, res) => {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    try {
        const { id: candidateId } = req.params;
        const { selectedElection } = req.body;

        if (!selectedElection) {
            return res.status(400).json({ message: "Election ID is required" });
        }

        // Get candidate
        const candidate = await CandidateModel.findById(candidateId).session(sess);
        if (!candidate) {
            await sess.abortTransaction();
            return res.status(404).json({ message: "Candidate not found" });
        }

        // Update vote count INSIDE transaction
        candidate.voteCount += 1;
        await candidate.save({ session: sess });

        // Get current voter
        let voterId = req.user.id;
        let voter = await VotersModel.findById(voterId).session(sess);
        if (!voter) {
            await sess.abortTransaction();
            return res.status(404).json({ message: "Voter not found" });
        }

        // Get selected election
        let election = await ElectionModel.findById(selectedElection).session(sess);
        if (!election) {
            await sess.abortTransaction();
            return res.status(404).json({ message: "Election not found" });
        }

        // Check if voter has already voted
        if (voter.VotedElections.includes(selectedElection)) {
            await sess.abortTransaction();
            return res.status(400).json({ message: "You have already voted in this election" });
        }

        // Update voter and election
        election.Voters.push(voterId);
        voter.VotedElections.push(selectedElection);

        await election.save({ session: sess });
        await voter.save({ session: sess });

        // Commit the transaction
        await sess.commitTransaction();
        res.status(200).json({ message: "Vote cast successfully", votedElections: voter.VotedElections });
    } catch (error) {
        console.error("Error in voteCandidate:", error);
        await sess.abortTransaction();
        res.status(500).json({ message: "Failed to Cast Vote", error: error.message });
    } finally {
        sess.endSession();
    }
};
