/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import Expense from '@/models/Expense';
import Showroom from '@/models/Showroom';
import Leave from '@/models/Leave';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (!session || !(['admin', 'super_admin', 'manager', 'showroom_manager'].includes(userRole))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const showroomParam = searchParams.get('showroom'); // 'all' or a specific showroom ObjectId

    // Default range: Last 30 days
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const defaultTo = new Date();

    let startDate = defaultFrom;
    if (from) {
      const parsedFrom = new Date(from);
      if (!isNaN(parsedFrom.getTime())) {
        startDate = new Date(Date.UTC(parsedFrom.getUTCFullYear(), parsedFrom.getUTCMonth(), parsedFrom.getUTCDate()));
      }
    } else {
      startDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate() - 30));
    }

    let endDate = defaultTo;
    if (to) {
      const parsedTo = new Date(to);
      if (!isNaN(parsedTo.getTime())) {
        endDate = new Date(Date.UTC(parsedTo.getUTCFullYear(), parsedTo.getUTCMonth(), parsedTo.getUTCDate(), 23, 59, 59, 999));
      }
    } else {
      endDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), 23, 59, 59, 999));
    }

    await connectToDatabase();

    // Build showroom filter
    // showroomParam: 'all' = everything, 'online' = no showroom (online/central), ObjectId = specific showroom
    if (showroomParam && showroomParam !== 'all' && showroomParam !== 'online' && !mongoose.Types.ObjectId.isValid(showroomParam)) {
      return NextResponse.json({ error: 'Invalid showroom parameter' }, { status: 400 });
    }
    const isOnlineFilter = showroomParam === 'online';
    const isShowroomFiltered = showroomParam && showroomParam !== 'all' && !isOnlineFilter && mongoose.Types.ObjectId.isValid(showroomParam);
    const showroomObjId = isShowroomFiltered ? new mongoose.Types.ObjectId(showroomParam!) : null;

    // For specific showroom: match that showroom. For online: match null showroom. For all: no filter.
    const onlineOrderFilter = { $or: [{ showroom: { $exists: false } }, { showroom: null }] };
    const orderShowroomFilter: any = isShowroomFiltered
      ? { showroom: showroomObjId }
      : isOnlineFilter
        ? onlineOrderFilter
        : {};
    const expenseShowroomFilter: any = isShowroomFiltered
      ? { showroom: showroomObjId }
      : isOnlineFilter
        ? onlineOrderFilter
        : {};

    // Fetch all static models concurrently
    const [
      BillModule,
      LedgerAccountModule,
      LedgerTransactionModule,
      LoanProviderModule,
      SupplierBillModule,
      BusinessLoanModule,
      TaskModule,
      SupplierModule
    ] = await Promise.all([
      import('@/models/Bill'),
      import('@/models/LedgerAccount'),
      import('@/models/LedgerTransaction'),
      import('@/models/LoanProvider'),
      import('@/models/SupplierBill'),
      import('@/models/BusinessLoan'),
      import('@/models/Task'),
      import('@/models/Supplier')
    ]);

    const Bill = BillModule.default;
    const LedgerAccount = LedgerAccountModule.default;
    const LedgerTransaction = LedgerTransactionModule.default;
    const LoanProvider = LoanProviderModule.default;
    const SupplierBill = SupplierBillModule.default;
    const BusinessLoan = BusinessLoanModule.default;
    const Task = TaskModule.default;
    const Supplier = SupplierModule.default;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const now = new Date();

    const creditOrderQuery: any = {
      paymentMethod: 'Credit',
      paymentStatus: { $ne: 'Paid' },
      status: { $nin: ['Cancelled', 'Order Placed'] },
      deletedAt: null,
      ...orderShowroomFilter
    };

    const billQuery: any = { documentType: 'bill', status: 'Due' };
    if (isShowroomFiltered) billQuery.showroom = showroomObjId;

    // Run ALL heavy aggregations and queries concurrently in parallel
    const [
      allShowrooms,
      revenueStats,
      expenseStats,
      incomeStats,
      generalUsersCount,
      wholesalersCount,
      pendingOrdersCount,
      pendingLeavesCount,
      recentOrders,
      lowStockProducts,
      activeSubscribers,
      totalWalletBalanceResult,
      topSellingProducts,
      topCustomers,
      allUsersWithOrders,
      ordersData,
      expensesIncomesData,
      creditOrders,
      dueBills,
      ledgerAccounts,
      loanProviders,
      dueSupplierBills,
      activeBusinessLoans,
      tasksList,
      pendingExpensesList,
      totalSuppliersCount,
      expiringProductsCount,
      expiredProductsCount
    ] = await Promise.all([
      // Showrooms
      Showroom.find({}).select('_id name').lean(),
      
      // 1 & 2. Revenue & COGS
      Order.aggregate([
        {
          $match: {
            status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
            createdAt: { $gte: startDate, $lte: endDate },
            deletedAt: null,
            ...orderShowroomFilter
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
      ]),

      // 3. Expenses
      Expense.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            type: { $ne: 'income' },
            status: 'Approved',
            ...expenseShowroomFilter
          }
        },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' }
          }
        }
      ]),

      // 3. Incomes
      Expense.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            type: 'income',
            status: 'Approved',
            ...expenseShowroomFilter
          }
        },
        {
          $group: {
            _id: null,
            totalIncomes: { $sum: '$amount' }
          }
        }
      ]),

      // 5. Total Customers
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'wholesaler' }),

      // 6. Pending Orders & Leaves
      Order.countDocuments({ status: 'Order Placed', deletedAt: null, ...orderShowroomFilter }),
      Leave.countDocuments({ status: 'Pending' }),

      // 7. Recent Orders
      Order.find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('slug totalAmount status createdAt user')
        .populate('user', 'name email')
        .lean(),

      // 8. Low Stock Products
      Product.find({ stock: { $lt: 5 } })
        .limit(5)
        .select('name stock price')
        .lean(),

      // 9. Loyalty Stats
      User.countDocuments({ isSubscriptionActive: true }),
      User.aggregate([
        { $group: { _id: null, total: { $sum: '$walletBalance' } } }
      ]),

      // 10. Top Selling Products
      Order.aggregate([
        { $match: { status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] }, createdAt: { $gte: startDate, $lte: endDate }, deletedAt: null, ...orderShowroomFilter } },
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
      ]),

      // 11. Top Customers
      Order.aggregate([
        { $match: { status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] }, createdAt: { $gte: startDate, $lte: endDate }, deletedAt: null, ...orderShowroomFilter } },
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
      ]),

      // 13. Users with Orders
      Order.aggregate([
        {
          $match: {
            deletedAt: null,
            createdAt: { $gte: startDate, $lte: endDate },
            ...orderShowroomFilter
          }
        },
        { $group: { _id: '$user', count: { $sum: 1 } } }
      ]),

      // 14. Chart Orders & Expenses
      Order.aggregate([
        {
          $match: {
            status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
            createdAt: { $gte: startDate, $lte: endDate },
            deletedAt: null,
            ...orderShowroomFilter
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              showroom: '$showroom'
            },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        }
      ]),

      Expense.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            status: 'Approved',
            ...expenseShowroomFilter
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              showroom: '$showroom',
              type: '$type'
            },
            amount: { $sum: '$amount' }
          }
        }
      ]),

      // Credit Orders
      Order.find(creditOrderQuery).populate('user', 'name email phone').lean() as Promise<any[]>,

      // Due Bills
      Bill.find(billQuery).lean() as Promise<any[]>,

      // Ledger Accounts & Loan Providers
      LedgerAccount.find().lean() as Promise<any[]>,
      LoanProvider.find({}).sort({ name: 1 }).lean() as Promise<any[]>,

      // Due Supplier Bills & Active Loans
      SupplierBill.find({ status: 'Due', ...(isShowroomFiltered ? { showroom: showroomObjId } : {}) }).lean() as Promise<any[]>,
      BusinessLoan.find({ status: 'Active' }).lean() as Promise<any[]>,

      // Tasks & Pending Expenses
      Task.find().select('status').lean() as Promise<any[]>,
      Expense.find({ type: 'expense', status: 'Pending', ...(isShowroomFiltered ? { showroom: showroomObjId } : {}) }).select('amount').lean() as Promise<any[]>,

      // Suppliers Count
      Supplier.countDocuments(),

      // Expiring & Expired Products
      Product.countDocuments({
        $or: [
          { batches: { $elemMatch: { expiryDate: { $gte: now, $lte: thirtyDaysFromNow } } } },
          { 'variants.batches': { $elemMatch: { expiryDate: { $gte: now, $lte: thirtyDaysFromNow } } } }
        ]
      }),
      Product.countDocuments({
        $or: [
          { batches: { $elemMatch: { expiryDate: { $lt: now } } } },
          { 'variants.batches': { $elemMatch: { expiryDate: { $lt: now } } } }
        ]
      })
    ]);

    const {
      totalRevenue = 0,
      totalDeliveryCharge = 0,
      salesCount = 0,
      totalCOGS = 0
    } = revenueStats[0] || {};

    const totalExpenses = expenseStats[0]?.totalExpenses || 0;
    const totalIncomes = incomeStats[0]?.totalIncomes || 0;

    // Calculations
    const grossProfit = totalRevenue - totalCOGS - totalDeliveryCharge;
    const netProfit = grossProfit + totalIncomes - totalExpenses;
    const totalUsers = (generalUsersCount || 0) + (wholesalersCount || 0);

    const totalWalletTokens = totalWalletBalanceResult[0]?.total || 0;

    // Customer counts
    const returningUsersCount = allUsersWithOrders.filter(u => u.count > 1).length;
    const newUsersCount = allUsersWithOrders.filter(u => u.count === 1).length;

    // Showroom map
    const showroomMap: Record<string, string> = {};
    allShowrooms.forEach((s: any) => {
      showroomMap[s._id.toString()] = s.name;
    });

    const mergedData: Record<string, any> = {};
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / dayMs);
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate.getTime() + i * dayMs);
      const dateStr = d.toISOString().split('T')[0];
      mergedData[dateStr] = {
        date: dateStr,
        revenue: 0,
        orders: 0,
        expense: 0,
        income: 0,
        showroomBreakdown: {}
      };
    }

    ordersData.forEach((item: any) => {
      const dateStr = item._id.date;
      if (!mergedData[dateStr]) return;
      
      const showroomId = item._id.showroom ? item._id.showroom.toString() : null;
      const showroomName = showroomId ? (showroomMap[showroomId] || 'Unknown Showroom') : 'Direct/Online';
      
      const revenue = item.revenue || 0;
      const orders = item.orders || 0;

      mergedData[dateStr].revenue += revenue;
      mergedData[dateStr].orders += orders;

      if (!mergedData[dateStr].showroomBreakdown[showroomName]) {
        mergedData[dateStr].showroomBreakdown[showroomName] = { revenue: 0, orders: 0, expense: 0, income: 0 };
      }
      mergedData[dateStr].showroomBreakdown[showroomName].revenue += revenue;
      mergedData[dateStr].showroomBreakdown[showroomName].orders += orders;
    });

    expensesIncomesData.forEach((item: any) => {
      const dateStr = item._id.date;
      if (!mergedData[dateStr]) return;

      const showroomId = item._id.showroom ? item._id.showroom.toString() : null;
      const showroomName = showroomId ? (showroomMap[showroomId] || 'Unknown Showroom') : 'Head Office';

      const amount = item.amount || 0;
      const isIncome = item._id.type === 'income';

      if (isIncome) {
        mergedData[dateStr].income += amount;
      } else {
        mergedData[dateStr].expense += amount;
      }

      if (!mergedData[dateStr].showroomBreakdown[showroomName]) {
        mergedData[dateStr].showroomBreakdown[showroomName] = { revenue: 0, orders: 0, expense: 0, income: 0 };
      }
      if (isIncome) {
        mergedData[dateStr].showroomBreakdown[showroomName].income += amount;
      } else {
        mergedData[dateStr].showroomBreakdown[showroomName].expense += amount;
      }
    });

    const chartData = Object.values(mergedData).sort((a: any, b: any) => a.date.localeCompare(b.date));

    // Calculate credit receivables
    const totalWholesalerDue = creditOrders.reduce((sum: number, o: any) => {
      const outstanding = (o.totalAmount || 0) - (o.couponDiscountAmount || 0) - (o.walletAmountUsed || 0);
      return sum + outstanding;
    }, 0);

    const todayDate = new Date();
    const maturedReceivableRaw = creditOrders.reduce((sum: number, o: any) => {
      if (o.expectedPaymentDate && new Date(o.expectedPaymentDate) < todayDate) {
        const outstanding = (o.totalAmount || 0) - (o.couponDiscountAmount || 0) - (o.walletAmountUsed || 0);
        return sum + outstanding;
      }
      return sum;
    }, 0);

    const totalBillDue = dueBills.reduce((sum: number, b: any) => sum + (b.currentBillDue || 0), 0);
    const maturedBillDueRaw = dueBills.reduce((sum: number, b: any) => {
      if (b.expectedReceivableDate && new Date(b.expectedReceivableDate) < todayDate) {
        return sum + (b.currentBillDue || 0);
      }
      return sum;
    }, 0);

    const cashAccount = ledgerAccounts.find((a: any) => a.code === 'CASH');
    const apAccount = ledgerAccounts.find((a: any) => a.code === 'AP');
    const bankAccounts = ledgerAccounts.filter((a: any) => a.accountCategory === 'Bank' && a.code !== 'BANK');
    const mfsAccounts = ledgerAccounts.filter((a: any) => a.accountCategory === 'MFS');

    let cashBalance = cashAccount ? cashAccount.currentBalance : 0;
    let supplierPayable = apAccount ? apAccount.currentBalance : 0;
    
    const bankBalancesList = bankAccounts.map(a => ({ id: String(a._id), name: a.name, balance: a.currentBalance }));
    const mfsBalancesList = mfsAccounts.map(a => ({ id: String(a._id), name: a.name, balance: a.currentBalance }));

    // If showroom is filtered, compute per-showroom balances from ledger transactions
    if (isShowroomFiltered) {
      const accountIdsToFetch = [];
      if (cashAccount) accountIdsToFetch.push(cashAccount._id);
      if (apAccount) accountIdsToFetch.push(apAccount._id);
      bankAccounts.forEach((a: any) => accountIdsToFetch.push(a._id));
      mfsAccounts.forEach((a: any) => accountIdsToFetch.push(a._id));

      const txResults = await LedgerTransaction.aggregate([
        { $match: { account: { $in: accountIdsToFetch }, showroom: showroomObjId } },
        {
          $group: {
            _id: '$account',
            debitSum: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
            creditSum: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } }
          }
        }
      ]);

      const txMap = new Map();
      txResults.forEach((res: any) => {
        txMap.set(String(res._id), res);
      });

      if (cashAccount) {
        const cashRes = txMap.get(String(cashAccount._id));
        cashBalance = cashRes ? cashRes.debitSum - cashRes.creditSum : 0;
      }
      if (apAccount) {
        const apRes = txMap.get(String(apAccount._id));
        supplierPayable = apRes ? apRes.creditSum - apRes.debitSum : 0; // AP is a liability
      }
      
      bankBalancesList.forEach(b => {
        const res = txMap.get(b.id);
        b.balance = res ? res.debitSum - res.creditSum : 0;
      });
      
      mfsBalancesList.forEach(m => {
        const res = txMap.get(m.id);
        m.balance = res ? res.debitSum - res.creditSum : 0;
      });
    }

    const bankBalance = bankBalancesList.reduce((sum, b) => sum + b.balance, 0);
    const mfsBalanceTotal = mfsBalancesList.reduce((sum, m) => sum + m.balance, 0);

    // Calculate account payable correctly from SupplierBill instead of just AP ledger balance, and calculate Matured Supplier Bills
    const accountReceivable = totalWholesalerDue + totalBillDue;
    const maturedReceivable = Math.min(maturedReceivableRaw + maturedBillDueRaw, accountReceivable);
    
    supplierPayable = dueSupplierBills.reduce((sum: number, b: any) => sum + (b.dueAmount || 0), 0);
    const maturedSupplierPayableRaw = dueSupplierBills.reduce((sum: number, b: any) => {
      if (b.expectedPaymentDate && new Date(b.expectedPaymentDate) < todayDate) {
        return sum + (b.dueAmount || 0);
      }
      return sum;
    }, 0);

    const businessLoanPayable = activeBusinessLoans.reduce((sum: number, l: any) => sum + (l.dueAmount || 0), 0);
    const maturedBusinessLoanRaw = activeBusinessLoans.reduce((sum: number, l: any) => {
      let maturedAmount = 0;
      if (l.repaymentType === 'Installment') {
        if (l.installmentDayOfMonth && l.installmentAmount && l.date) {
          const loanStartDate = new Date(l.date);
          const currentYear = todayDate.getFullYear();
          const currentMonth = todayDate.getMonth();
          
          let passedInstallments = 0;
          let diffMonths = (currentYear - loanStartDate.getFullYear()) * 12 + (currentMonth - loanStartDate.getMonth());
          if (todayDate.getDate() < l.installmentDayOfMonth) {
            diffMonths--;
          }
          passedInstallments = Math.max(0, diffMonths);

          const expectedPaid = passedInstallments * l.installmentAmount;
          maturedAmount = Math.max(0, expectedPaid - (l.paidAmount || 0));
        }
      } else {
        if (l.expectedRepaymentDate && new Date(l.expectedRepaymentDate) < todayDate) {
          maturedAmount = l.dueAmount || 0;
        }
      }
      return sum + maturedAmount;
    }, 0);

    const maturedPayable = maturedSupplierPayableRaw + maturedBusinessLoanRaw;

    // Running tasks count
    const runningAssignedTasks = tasksList.filter((t: any) => t.status === 'Pending').length;

    // Pending expenses
    const pendingExpenseCount = pendingExpensesList.length;
    const pendingExpenseTotal = pendingExpensesList.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);

    // Wholesaler dues
    const wholesalerDuesMap: Record<string, any> = {};
    for (const order of creditOrders) {
      if (!order.user) continue;
      const uId = String(order.user._id);
      const outstanding = (order.totalAmount || 0) - (order.couponDiscountAmount || 0) - (order.walletAmountUsed || 0);
      if (wholesalerDuesMap[uId]) {
        wholesalerDuesMap[uId].due += outstanding;
      } else {
        wholesalerDuesMap[uId] = {
          name: order.user.name || 'Unknown Wholesaler',
          email: order.user.email,
          phone: order.user.phone,
          due: outstanding
        };
      }
    }
    const wholesalersDueList = Object.values(wholesalerDuesMap).sort((a: any, b: any) => b.due - a.due);

    return NextResponse.json({
      stats: {
        totalRevenue,
        salesCount,
        totalUsers,
        generalUsersCount,
        wholesalersCount,
        pendingOrdersCount,
        activeSubscribers,
        totalWalletTokens,
        totalCOGS,
        totalExpenses,
        grossProfit,
        netProfit,
        newUsersCount,
        returningUsersCount,
        totalWholesalerDue,
        cashBalance,
        bankBalance,
        bankBalancesList,
        mfsBalanceTotal,
        mfsBalancesList,
        accountReceivable,
        supplierPayable,
        maturedSupplierPayable: maturedSupplierPayableRaw,
        businessLoanPayable,
        maturedBusinessLoan: maturedBusinessLoanRaw,
        maturedReceivable,
        maturedWholesalerDue: maturedReceivableRaw,
        maturedGeneralDue: maturedBillDueRaw,
        totalBillDue,
        maturedPayable,
        runningAssignedTasks,
        pendingExpenseCount,
        pendingExpenseTotal,
        totalSuppliersCount,
        expiringProductsCount,
        expiredProductsCount,
        pendingLeavesCount,
        isShowroomFiltered: !!isShowroomFiltered,
        ledgerAccounts: ledgerAccounts || [],
        loanProviders: loanProviders || []
      },
      recentOrders,
      lowStockProducts,
      topSellingProducts,
      topCustomers,
      chartData,
      wholesalersDueList,
      showrooms: allShowrooms
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
