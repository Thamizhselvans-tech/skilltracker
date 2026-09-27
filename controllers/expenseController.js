const Expense = require('../models/Expense');

// @desc    Get expenses with search, category, and date range filters
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { search, category, startDate, endDate, month } = req.query;
    const query = { userId: req.user._id };

    if (search) {
      query.itemName = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (month) {
      // month formatted as YYYY-MM
      query.date = { $regex: `^${month}` };
    }

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });

    // Calculate totals
    const totalAmount = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Calculate category breakdown
    const categoryBreakdown = {};
    expenses.forEach((item) => {
      const cat = item.category || 'General';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + item.amount;
    });

    return res.json({
      success: true,
      count: expenses.length,
      totalAmount,
      categoryBreakdown,
      data: expenses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    const { itemName, amount, category, date, paymentMethod, notes } = req.body;

    if (!itemName || amount === undefined || !date) {
      return res.status(400).json({ success: false, message: 'Item name, amount, and date are required' });
    }

    const expense = await Expense.create({
      userId: req.user._id,
      itemName,
      amount: Number(amount),
      category: category || 'General',
      date,
      paymentMethod: paymentMethod || 'UPI',
      notes: notes || '',
    });

    return res.status(201).json({ success: true, data: expense });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found or unauthorized' });
    }

    const { itemName, amount, category, date, paymentMethod, notes } = req.body;

    if (itemName) expense.itemName = itemName;
    if (amount !== undefined) expense.amount = Number(amount);
    if (category) expense.category = category;
    if (date) expense.date = date;
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();
    return res.json({ success: true, data: expense });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found or unauthorized' });
    }
    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
