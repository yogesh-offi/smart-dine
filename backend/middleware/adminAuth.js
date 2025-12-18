import User from "../models/User.js";

const adminAuth = async (req, res, next) => {
  const userId = req.headers["x-user-id"]; // simple for now

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await User.findById(userId);

  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};

export default adminAuth;
