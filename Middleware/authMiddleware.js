const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_KEY;

const authMiddleware = (req, res, next) => {
    try {
        // Correct way to access Authorization header (lowercase 'authorization')
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.json({ message: "Access denied... Please provide a token" });
        }

        // Extract the token
        const token = authHeader.split(" ")[1]; // Remove "Bearer " from the header

        // Verify the token
         jwt.verify(token, secretKey, (err, info) =>{
            if(err){
                return res.status(403).json({message:"unauthorized token", err: err.message})
            }

            req.user = info ;
            next();
         });

        // Attach decoded user information to the request object
        // req.user = info;

        // Proceed to the next middleware or route
    } catch (error) {
        res.status(403).json({ message: 'Invalid or expired token', error: error.message });
    }
};

module.exports = { authMiddleware };
