import express from "express";
import {
  getDailyStats,
  getWeeklyStats,
  getDashboardMonthlyStats,
  getYearlyStats,
  getDashboardTotalStats,
  getCustomRangeStats,
  getDailyProductionStats,
  getWeeklyProductionStats,
  getMonthlyProductionStats,
  getYearlyProductionStats,
  getTotalProductionStats,
  getCustomRangeProductionStats,
  getDailyOrderStats,
  getWeeklyOrderStats,
  getMonthlyOrderStats,
  getYearlyOrderStats,
  getTotalOrderStats,
  getCustomRangeOrderStats,
} from "../controllers/dashboardController.js";
import { isLogin } from "../middleware/isAuthenticated.js"; 
const router = express.Router();
router.use(isLogin); 


router.get("/inventory/stats/daily",   getDailyStats);
router.get("/inventory/stats/weekly",  getWeeklyStats);
router.get("/inventory/stats/monthly", getDashboardMonthlyStats);
router.get("/inventory/stats/yearly",  getYearlyStats);
router.get("/inventory/stats/total",   getDashboardTotalStats);
router.get("/inventory/stats/custom",  getCustomRangeStats);
router.get("/production/stats/daily",   getDailyProductionStats);
router.get("/production/stats/weekly",  getWeeklyProductionStats);
router.get("/production/stats/monthly", getMonthlyProductionStats);
router.get("/production/stats/yearly",  getYearlyProductionStats);
router.get("/production/stats/total",   getTotalProductionStats);
router.get("/production/stats/custom",  getCustomRangeProductionStats);
router.get("/stats/daily", getDailyOrderStats);
router.get("/stats/weekly",getWeeklyOrderStats);
router.get("/stats/monthly",getMonthlyOrderStats);
router.get("/stats/yearly",getYearlyOrderStats);
router.get("/stats/total", getTotalOrderStats);
router.get("/stats/custom",getCustomRangeOrderStats);

export default router;








 
