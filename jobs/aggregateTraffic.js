const cron = require("node-cron");
const Traffic = require("../models/Traffic");
const TrafficStats = require("../models/TrafficStats");

const aggregateTraffic = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trafficData = await Traffic.aggregate([
      { $match: { timestamp: { $gte: today } } },
      {
        $group: {
          _id: null,
          visits: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$ip" },
        },
      },
    ]);

    const stats = trafficData[0] || { visits: 0, uniqueVisitors: [] };
    await TrafficStats.findOneAndUpdate(
      { date: today },
      { visits: stats.visits, uniqueVisitors: stats.uniqueVisitors.length },
      { upsert: true }
    );

    // console.log("Traffic aggregated:", stats);
  } catch (err) {
    console.error("Aggregation error:", err);
  }
};

// Run daily at midnight
cron.schedule("* * * * *", aggregateTraffic);

module.exports = aggregateTraffic;