import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import Expense from '@/models/Expense';
import Bill from '@/models/Bill';
import SupplierBill from '@/models/SupplierBill';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Default range: Last 30 days
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const defaultTo = new Date();

    let startDate = defaultFrom;
    if (from) {
      const parsedFrom = new Date(from);
      if (!isNaN(parsedFrom.getTime())) {
        startDate = parsedFrom;
      }
    }

    let endDate = defaultTo;
    if (to) {
      const parsedTo = new Date(to);
      if (!isNaN(parsedTo.getTime())) {
        endDate = parsedTo;
      }
    }
    endDate.setHours(23, 59, 59, 999);

    await connectToDatabase();

    // 1 & 2. Total Revenue, COGS, and Sales Count (Delivered Orders)
    const revenueStats = await Order.aggregate([
      { 
        $match: { 
          status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
          createdAt: { $gte: startDate, $lte: endDate },
          deletedAt: null
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalDeliveryCharge: { $sum: '$deliveryCharge' },
          salesCount: { $sum: 1 },
          totalCOGS: { 
            $sum: { 
              $sum: {
                $map: {
                  input: '$items',
                  as: 'item',
                  in: { $multiply: ['$$item.quantity', { $ifNull: ['$$item.purchasePrice', 0] }] }
                }
              }
            }
          }
        }
      }
    ]);

    const { 
      totalRevenue = 0, 
      totalDeliveryCharge = 0,
      salesCount = 0, 
      totalCOGS = 0 
    } = revenueStats[0] || {};

    // 3. Expenses & Incomes
    const expenseStats = await Expense.aggregate([
      { 
        $match: { 
          date: { $gte: startDate, $lte: endDate },
          type: { $ne: 'income' }
        } 
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);
    const totalExpenses = expenseStats[0]?.totalExpenses || 0;

    const incomeStats = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          type: 'income'
        }
      },
      {
        $group: {
          _id: null,
          totalIncomes: { $sum: '$amount' }
        }
      }
    ]);
    const totalIncomes = incomeStats[0]?.totalIncomes || 0;

    // 4. Calculations
    const grossProfit = totalRevenue - totalCOGS - totalDeliveryCharge;
    const netProfit = grossProfit + totalIncomes - totalExpenses;

    // 5. Total Customers (Only users with role 'user')
    const totalUsers = await User.countDocuments({ 
      role: 'user' 
    });

    // 6. Pending Orders (Total, not date filtered)
    const pendingOrdersCount = await Order.countDocuments({ status: 'Order Placed', deletedAt: null });

    // 7. Recent Orders
    const recentOrders = await Order.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('slug totalAmount status createdAt')
      .populate('user', 'name email');

    // 8. Low Stock Products
    const lowStockProducts = await Product.find({ stock: { $lt: 5 } })
      .limit(5)
      .select('name stock price');

    // 9. Loyalty Stats
    const activeSubscribers = await User.countDocuments({ isSubscriptionActive: true });
    const totalWalletBalanceResult = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$walletBalance' } } }
    ]);
    const totalWalletTokens = totalWalletBalanceResult[0]?.total || 0;

    // 10. Top Selling Products
    const topSellingProducts = await Order.aggregate([
      { $match: { status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] }, createdAt: { $gte: startDate, $lte: endDate }, deletedAt: null } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          quantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // 11. Top Customers
    const topCustomers = await Order.aggregate([
      { $match: { status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] }, createdAt: { $gte: startDate, $lte: endDate }, deletedAt: null } },
      {
        $group: {
          _id: '$user',
          totalSpend: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: '$userData' },
      {
        $project: {
          name: '$userData.name',
          email: '$userData.email',
          totalSpend: 1,
          orderCount: 1
        }
      }
    ]);

    // 12. Ad ROI (ROAS)
    const adExpenses = await Expense.aggregate([
      { $match: { category: 'Ads', date: { $gte: startDate, $lte: endDate }, type: { $ne: 'income' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAdSpend = adExpenses[0]?.total || 0;
    const roas = totalAdSpend > 0 ? Number((totalRevenue / totalAdSpend).toFixed(2)) : 0;

    // 13. New vs Returning (Sample simplified logic)
    const allUsersWithOrders = await Order.aggregate([
      { 
        $match: { 
          deletedAt: null,
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      { $group: { _id: '$user', count: { $sum: 1 } } }
    ]);
    const returningUsersCount = allUsersWithOrders.filter(u => u.count > 1).length;
    const newUsersCount = allUsersWithOrders.filter(u => u.count === 1).length;

    // 14. Chart Data & Simple Forecast
    const chartData = await Order.aggregate([
      {
        $match: {
          status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
          createdAt: { $gte: startDate, $lte: endDate },
          deletedAt: null
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          cogs: { 
            $sum: { 
              $sum: {
                $map: {
                  input: '$items',
                  as: 'item',
                  in: { $multiply: ['$$item.quantity', { $ifNull: ['$$item.purchasePrice', 0] }] }
                }
              }
            }
          },
          deliveryCharge: { $sum: '$deliveryCharge' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          revenue: 1,
          orders: 1,
          profit: { $subtract: [{ $subtract: ['$revenue', '$cogs'] }, '$deliveryCharge'] }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Aggregate daily expenses
    const dailyExpenses = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          type: { $ne: 'income' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          expenses: { $sum: '$amount' }
        }
      }
    ]);

    // Combine chartData and dailyExpenses by date
    const chartDataMap = new Map<string, { date: string; revenue: number; orders: number; profit: number; expenses: number }>();

    chartData.forEach((item: any) => {
      chartDataMap.set(item.date, {
        date: item.date,
        revenue: item.revenue || 0,
        orders: item.orders || 0,
        profit: item.profit || 0,
        expenses: 0
      });
    });

    dailyExpenses.forEach((item: any) => {
      const dateStr = item._id;
      const existing = chartDataMap.get(dateStr);
      if (existing) {
        existing.expenses = item.expenses || 0;
      } else {
        chartDataMap.set(dateStr, {
          date: dateStr,
          revenue: 0,
          orders: 0,
          profit: 0,
          expenses: item.expenses || 0
        });
      }
    });

    const combinedChartData = Array.from(chartDataMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Simple Forecasting: Average Daily Revenue * 30
    const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const avgDailyRevenue = totalRevenue / daysInRange;
    const projectedMonthlyRevenue = avgDailyRevenue * 30;

    // Accounts Receivable: Sum of currentBillDue from client bills
    const arStats = await Bill.aggregate([
      { $match: { documentType: 'bill' } },
      { $group: { _id: null, total: { $sum: '$currentBillDue' } } }
    ]);
    const accountsReceivable = arStats[0]?.total || 0;

    // Accounts Payable: Sum of dueAmount from supplier bills
    const apStats = await SupplierBill.aggregate([
      { $group: { _id: null, total: { $sum: '$dueAmount' } } }
    ]);
    const accountsPayable = apStats[0]?.total || 0;

    return NextResponse.json({
      stats: {
        totalRevenue,
        salesCount,
        totalUsers,
        pendingOrdersCount,
        activeSubscribers,
        totalWalletTokens,
        totalCOGS,
        totalExpenses,
        grossProfit,
        netProfit,
        roas,
        totalAdSpend,
        newUsersCount,
        returningUsersCount,
        projectedMonthlyRevenue,
        accountsReceivable,
        accountsPayable
      },
      recentOrders,
      lowStockProducts,
      topSellingProducts,
      topCustomers,
      chartData: combinedChartData
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
