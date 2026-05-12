
import mongoose from "mongoose";
import inventoryModel from "../models/inventoryModel.js"; 
import productionModel from "../models/productionModel.js";
import orderModel from "../models/orderModel.js"; 

// inventory
const getDateRange = (type) => {
  const now = new Date();

  switch (type) {
    case "daily":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());

    case "weekly": {
      const day = now.getDay(); // 0 = Sunday
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      return new Date(now.getFullYear(), now.getMonth(), diff);
    }

    case "monthly":
      return new Date(now.getFullYear(), now.getMonth(), 1);

    case "yearly":
      return new Date(now.getFullYear(), 0, 1);

    default:
      return null;
  }
};
const buildStatsPipeline = (matchQuery = {}) => [
  {
    $facet: {
      totalOrders: [
        { $match: matchQuery },
        { $count: "count" },
      ],

      receivedOrders: [
        { $match: { ...matchQuery, status: "Received" } },
        { $count: "count" },
      ],

      pendingOrders: [
        { $match: { ...matchQuery, status: "Pending" } },
        { $count: "count" },
      ],

      placedOrders: [
        { $match: { ...matchQuery, status: "Placed" } },
        { $count: "count" },
      ],

      revenueStats: [
        { $match: { ...matchQuery, status: "Received" } },
        {
          $group: {
            _id: null,
            totalPrice: { $sum: { $multiply: ["$price", "$quantity"] } },
            totalQuantity: { $sum: "$quantity" },
          },
        },
      ],
    },
  },
  {
    $project: {
      totalOrders: {
        $ifNull: [{ $arrayElemAt: ["$totalOrders.count", 0] }, 0],
      },
      receivedOrders: {
        $ifNull: [{ $arrayElemAt: ["$receivedOrders.count", 0] }, 0],
      },
      pendingOrders: {
        $ifNull: [{ $arrayElemAt: ["$pendingOrders.count", 0] }, 0],
      },
      placedOrders: {
        $ifNull: [{ $arrayElemAt: ["$placedOrders.count", 0] }, 0],
      },
      totalPrice: {
        $ifNull: [{ $arrayElemAt: ["$revenueStats.totalPrice", 0] }, 0],
      },
      totalQuantity: {
        $ifNull: [{ $arrayElemAt: ["$revenueStats.totalQuantity", 0] }, 0],
      },
    },
  },
];
export const getDailyStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const startOfDay = getDateRange("daily");
    const stats = await inventoryModel.aggregate(
      buildStatsPipeline({ createdAt: { $gte: startOfDay } })
    );

    res.status(200).json({ success: true, period: "daily", stats: stats[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getWeeklyStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const startOfWeek = getDateRange("weekly");
    const stats = await inventoryModel.aggregate(
      buildStatsPipeline({ createdAt: { $gte: startOfWeek } })
    );

    res.status(200).json({ success: true, period: "weekly", stats: stats[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getDashboardMonthlyStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const startOfMonth = getDateRange("monthly");
    const stats = await inventoryModel.aggregate(
      buildStatsPipeline({ createdAt: { $gte: startOfMonth } })
    );

    res.status(200).json({ success: true, period: "monthly", stats: stats[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getYearlyStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const startOfYear = getDateRange("yearly");
    const stats = await inventoryModel.aggregate(
      buildStatsPipeline({ createdAt: { $gte: startOfYear } })
    );

    res.status(200).json({ success: true, period: "yearly", stats: stats[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getDashboardTotalStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const stats = await inventoryModel.aggregate(buildStatsPipeline({}));

    res.status(200).json({ success: true, period: "all-time", stats: stats[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getCustomRangeStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate required ",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    end.setHours(23, 59, 59, 999);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ success: false, message: "Invalid date format" });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "startDate must be less than or equal to endDate",
      });
    }

    const matchQuery = { createdAt: { $gte: start, $lte: end } };
    const stats = await inventoryModel.aggregate(buildStatsPipeline(matchQuery));

    res.status(200).json({
      success: true,
      period: "custom",
      range: { startDate: start, endDate: end },
      stats: stats[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// production

const getDateRangeProduction = (type) => {
  const now = new Date();
  switch (type) {
    case "daily":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());

    case "weekly": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      return new Date(now.getFullYear(), now.getMonth(), diff);
    }

    case "monthly":
      return new Date(now.getFullYear(), now.getMonth(), 1);

    case "yearly":
      return new Date(now.getFullYear(), 0, 1);

    default:
      return null;
  }
};
const buildProductionPipeline = (matchQuery = {}) => [
  {
    $facet: {

      // Total batches in range
      totalBatches: [
        { $match: matchQuery },
        { $count: "count" },
      ],

      // Completed batches
      completedBatches: [
        { $match: { ...matchQuery, status: "Completed" } },
        { $count: "count" },
      ],

      // Running batches
      runningBatches: [
        { $match: { ...matchQuery, status: "Running" } },
        { $count: "count" },
      ],

      // Queued batches
      queuedBatches: [
        { $match: { ...matchQuery, status: "Queued" } },
        { $count: "count" },
      ],

      // Cancelled batches
      cancelledBatches: [
        { $match: { ...matchQuery, status: "Cancelled" } },
        { $count: "count" },
      ],

      // Cost, production output, waste — Completed + Running
      productionStats: [
        {
          $match: {
            ...matchQuery,
            status: { $in: ["Completed", "Running"] },
          },
        },
        {
          $group: {
            _id: null,
            totalCost:       { $sum: "$totalCost" },
            totalProduction: { $sum: "$production" }, // KG output
            totalWaste:      { $sum: "$waste" },
          },
        },
      ],
    },
  },
  {
    $project: {
      totalBatches: {
        $ifNull: [{ $arrayElemAt: ["$totalBatches.count", 0] }, 0],
      },
      completedBatches: {
        $ifNull: [{ $arrayElemAt: ["$completedBatches.count", 0] }, 0],
      },
      runningBatches: {
        $ifNull: [{ $arrayElemAt: ["$runningBatches.count", 0] }, 0],
      },
      queuedBatches: {
        $ifNull: [{ $arrayElemAt: ["$queuedBatches.count", 0] }, 0],
      },
      cancelledBatches: {
        $ifNull: [{ $arrayElemAt: ["$cancelledBatches.count", 0] }, 0],
      },
      totalCost: {
        $ifNull: [{ $arrayElemAt: ["$productionStats.totalCost", 0] }, 0],
      },
      totalProduction: {
        $ifNull: [{ $arrayElemAt: ["$productionStats.totalProduction", 0] }, 0],
      },
      totalWaste: {
        $ifNull: [{ $arrayElemAt: ["$productionStats.totalWaste", 0] }, 0],
      },
    },
  },
];
export const getDailyProductionStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const startOfDay = getDateRangeProduction("daily");
    const stats = await productionModel.aggregate(
      buildProductionPipeline({ createdAt: { $gte: startOfDay } })
    );

    res.status(200).json({ success: true, period: "daily", stats: stats[0] });
  } catch (err) {
    console.error("getDailyProductionStats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getWeeklyProductionStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const startOfWeek = getDateRangeProduction("weekly");
    const stats = await productionModel.aggregate(
      buildProductionPipeline({ createdAt: { $gte: startOfWeek } })
    );

    res.status(200).json({ success: true, period: "weekly", stats: stats[0] });
  } catch (err) {
    console.error("getWeeklyProductionStats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getMonthlyProductionStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const startOfMonth = getDateRangeProduction("monthly");
    const stats = await productionModel.aggregate(
      buildProductionPipeline({ createdAt: { $gte: startOfMonth } })
    );

    res.status(200).json({ success: true, period: "monthly", stats: stats[0] });
  } catch (err) {
    console.error("getMonthlyProductionStats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getYearlyProductionStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const startOfYear = getDateRangeProduction("yearly");
    const stats = await productionModel.aggregate(
      buildProductionPipeline({ createdAt: { $gte: startOfYear } })
    );

    res.status(200).json({ success: true, period: "yearly", stats: stats[0] });
  } catch (err) {
    console.error("getYearlyProductionStats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getTotalProductionStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const stats = await productionModel.aggregate(buildProductionPipeline({}));

    res.status(200).json({ success: true, period: "all-time", stats: stats[0] });
  } catch (err) {
    console.error("getTotalProductionStats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getCustomRangeProductionStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate aur endDate dono required hain",
      });
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);

    // End date ka poora din include karne ke liye
    end.setHours(23, 59, 59, 999);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ success: false, message: "Invalid date format" });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "startDate, endDate se pehle honi chahiye",
      });
    }

    const matchQuery = { createdAt: { $gte: start, $lte: end } };
    const stats = await productionModel.aggregate(buildProductionPipeline(matchQuery));

    res.status(200).json({
      success: true,
      period: "custom",
      range: { startDate: start, endDate: end },
      stats: stats[0],
    });
  } catch (err) {
    console.error("getCustomRangeProductionStats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// orders

const getDateRangeorder = (type) => {
  const now = new Date();
  switch (type) {
    case "daily":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());

    case "weekly": {
      const day  = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      return new Date(now.getFullYear(), now.getMonth(), diff);
    }

    case "monthly":
      return new Date(now.getFullYear(), now.getMonth(), 1);

    case "yearly":
      return new Date(now.getFullYear(), 0, 1);

    default:
      return null;
  }
};

const buildOrderPipeline = (matchQuery = {}) => [
  {
    $facet: {

      totalOrders: [
        { $match: matchQuery },
        { $count: "count" },
      ],

      completedOrders: [
        { $match: { ...matchQuery, status: "Completed" } },
        { $count: "count" },
      ],

      pendingOrders: [
        { $match: { ...matchQuery, status: "Pending" } },
        { $count: "count" },
      ],

      cancelledOrders: [
        { $match: { ...matchQuery, status: "Cancelled" } },
        { $count: "count" },
      ],

      // Revenue stats — Completed + Pending orders se
      revenueStats: [
        {
          $match: {
            ...matchQuery,
            status: { $in: ["Completed", "Pending"] },
          },
        },
        {
          $group: {
            _id:                null,
            totalAmount:        { $sum: "$totalPayment" },
            totalQuantityKG:    { $sum: "$quantityKG" },
            totalPaymentPaid:   { $sum: "$paymentPaid" },
            totalPaymentPending:{ $sum: "$paymentPending" },
          },
        },
      ],
    },
  },
  {
    $project: {
      totalOrders: {
        $ifNull: [{ $arrayElemAt: ["$totalOrders.count", 0] }, 0],
      },
      completedOrders: {
        $ifNull: [{ $arrayElemAt: ["$completedOrders.count", 0] }, 0],
      },
      pendingOrders: {
        $ifNull: [{ $arrayElemAt: ["$pendingOrders.count", 0] }, 0],
      },
      cancelledOrders: {
        $ifNull: [{ $arrayElemAt: ["$cancelledOrders.count", 0] }, 0],
      },
      totalAmount: {
        $ifNull: [{ $arrayElemAt: ["$revenueStats.totalAmount", 0] }, 0],
      },
      totalQuantityKG: {
        $ifNull: [{ $arrayElemAt: ["$revenueStats.totalQuantityKG", 0] }, 0],
      },
      totalPaymentPaid: {
        $ifNull: [{ $arrayElemAt: ["$revenueStats.totalPaymentPaid", 0] }, 0],
      },
      totalPaymentPending: {
        $ifNull: [{ $arrayElemAt: ["$revenueStats.totalPaymentPending", 0] }, 0],
      },
    },
  },
];

export const getDailyOrderStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const startOfDay = getDateRangeorder("daily");
    const stats = await orderModel.aggregate(
      buildOrderPipeline({ createdAt: { $gte: startOfDay } })
    );

    res.status(200).json({ success: true, period: "daily", stats: stats[0] });
  } catch (err) {
    console.error("getDailyOrderStats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getWeeklyOrderStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const startOfWeek = getDateRangeorder("weekly");
    const stats = await orderModel.aggregate(
      buildOrderPipeline({ createdAt: { $gte: startOfWeek } })
    );

    res.status(200).json({ success: true, period: "weekly", stats: stats[0] });
  } catch (err) {
    console.error("getWeeklyOrderStats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getMonthlyOrderStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const startOfMonth = getDateRangeorder("monthly");
    const stats = await orderModel.aggregate(
      buildOrderPipeline({ createdAt: { $gte: startOfMonth } })
    );

    res.status(200).json({ success: true, period: "monthly", stats: stats[0] });
  } catch (err) {
    console.error("getMonthlyOrderStats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getYearlyOrderStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const startOfYear = getDateRangeorder("yearly");
    const stats = await orderModel.aggregate(
      buildOrderPipeline({ createdAt: { $gte: startOfYear } })
    );

    res.status(200).json({ success: true, period: "yearly", stats: stats[0] });
  } catch (err) {
    console.error("getYearlyOrderStats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getTotalOrderStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const stats = await orderModel.aggregate(buildOrderPipeline({}));

    res.status(200).json({ success: true, period: "all-time", stats: stats[0] });
  } catch (err) {
    console.error("getTotalOrderStats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getCustomRangeOrderStats = async (req, res) => {
  try {
    const userId = req.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false, data: null });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate aur endDate dono required hain",
      });
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);

    // End date ka poora din include karne ke liye
    end.setHours(23, 59, 59, 999);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ success: false, message: "Invalid date format" });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "startDate, endDate se pehle honi chahiye",
      });
    }

    const matchQuery = { createdAt: { $gte: start, $lte: end } };
    const stats = await orderModel.aggregate(buildOrderPipeline(matchQuery));

    res.status(200).json({
      success: true,
      period: "custom",
      range: { startDate: start, endDate: end },
      stats: stats[0],
    });
  } catch (err) {
    console.error("getCustomRangeOrderStats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};