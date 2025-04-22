const User = require('../models/User');

const matchBuddies = async (userId) => {
  const user = await User.findById(userId);
  const buddies = await User.find({
    _id: { $ne: userId }, // Exclude the current user
    preferences: { $in: user.preferences }, // Match preferences
    goals: user.goals, // Match goals
  }).limit(5); // Limit to 5 matches
  return buddies;
};

module.exports = matchBuddies;