// autohandler/status.js
const activities = [
  { type: 3, name: '$help | TRIDENT' }, // Listening to '-help | ALPHA MUSIC' 0-play 
  { type: 3, name: 'TRIDENT DEVELOPMENT' }, // Listening to 'ALPHA MUSIC'    1-streaming
  { type: 3, name: 'FEEL FREE' }, // Listening to 'LOVERS ARENAA'2-listening.... 3= watching
];

module.exports = function(client) {
  const status = 'idle'; // Set status to idle

  // Function to change activity at intervals
  let activityIndex = 0;
  setInterval(() => {
    const activity = activities[activityIndex];
    client.user.setPresence({
      status: status, // Set bot status to 'idle'
      activities: [{
        name: activity.name,
        type: activity.type, // Type '3' for listening activity
      }],
    });

    // Cycle through activities
    activityIndex = (activityIndex + 1) % activities.length;
  }, 10000); // Change activity every 10 seconds (10000 ms)
};