const db = require("../../../models");

const EXPENSE_CATEGORIES = [
  "Rent",
  "Salary",
  "Electricity",
  "Water",
  "Internet",
  "Transport",
  "Supplies",
  "Maintenance",
  "Marketing",
  "Food",
  "Other",
];

const PAYMENT_METHODS = ["Cash", "Online", "UPI"];

let ensuringTable = null;

async function ensureExpenseTable() {
  if (ensuringTable) return ensuringTable;
  ensuringTable = (async () => {
    const qi = db.sequelize.getQueryInterface();
    const tables = await qi.showAllTables();
    const names = tables.map((t) =>
      String(typeof t === "string" ? t : t.tableName || t.name || "")
    );
    if (names.includes("store_expenses")) return;
    await qi.createTable("store_expenses", {
      id: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      storeId: { type: db.Sequelize.INTEGER, allowNull: false },
      expenseDate: { type: db.Sequelize.DATEONLY, allowNull: false },
      category: {
        type: db.Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "Other",
      },
      title: { type: db.Sequelize.STRING(255), allowNull: false },
      amount: {
        type: db.Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      paymentMethod: {
        type: db.Sequelize.STRING(20),
        allowNull: true,
        defaultValue: "Cash",
      },
      note: { type: db.Sequelize.TEXT, allowNull: true },
      createdAt: { type: db.Sequelize.DATE, allowNull: false },
      updatedAt: { type: db.Sequelize.DATE, allowNull: false },
    });
  })().catch((err) => {
    ensuringTable = null;
    throw err;
  });
  return ensuringTable;
}

function normalizeExpensePayload(body = {}) {
  const title = String(body.title || "").trim();
  const amount = Number(body.amount);
  const category = EXPENSE_CATEGORIES.includes(body.category)
    ? body.category
    : "Other";
  const paymentMethod = PAYMENT_METHODS.includes(body.paymentMethod)
    ? body.paymentMethod
    : "Cash";
  const expenseDate = String(body.expenseDate || "").slice(0, 10);
  const note = body.note != null ? String(body.note).trim() : null;
  return { title, amount, category, paymentMethod, expenseDate, note };
}

function validateExpense({ title, amount, expenseDate }) {
  if (!title) return "Expense title is required";
  if (!Number.isFinite(amount) || amount <= 0) return "Enter a valid amount";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) return "Expense date is required";
  return null;
}

module.exports = {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,

  async listExpenses(req, res) {
    try {
      await ensureExpenseTable();
      const storeId = Number(req.params.storeId);
      if (!Number.isFinite(storeId) || storeId <= 0) {
        return res.status(400).json({ success: false, errors: ["Store ID is required"] });
      }
      const rows = await db.store_expense.findAll({
        where: { storeId },
        order: [
          ["expenseDate", "DESC"],
          ["id", "DESC"],
        ],
      });
      res.status(200).json({ success: true, data: rows });
    } catch (err) {
      console.error(err, "Error fetching expenses");
      res.status(500).json({
        success: false,
        errors: ["Error fetching expenses", err.message],
      });
    }
  },

  async addExpense(req, res) {
    try {
      await ensureExpenseTable();
      const storeId = Number(req.body.storeId);
      if (!Number.isFinite(storeId) || storeId <= 0) {
        return res.status(400).json({ success: false, errors: ["storeId is required"] });
      }
      const payload = normalizeExpensePayload(req.body);
      const error = validateExpense(payload);
      if (error) {
        return res.status(400).json({ success: false, errors: [error] });
      }
      const row = await db.store_expense.create({ storeId, ...payload });
      res.status(200).json({ success: true, data: row, msg: "Expense added" });
    } catch (err) {
      console.error(err, "Error adding expense");
      res.status(500).json({
        success: false,
        errors: ["Error adding expense", err.message],
      });
    }
  },

  async updateExpense(req, res) {
    try {
      await ensureExpenseTable();
      const id = Number(req.params.id);
      const row = await db.store_expense.findByPk(id);
      if (!row) {
        return res.status(404).json({ success: false, errors: ["Expense not found"] });
      }
      const payload = normalizeExpensePayload({ ...row.get({ plain: true }), ...req.body });
      const error = validateExpense(payload);
      if (error) {
        return res.status(400).json({ success: false, errors: [error] });
      }
      await row.update(payload);
      res.status(200).json({ success: true, data: row, msg: "Expense updated" });
    } catch (err) {
      console.error(err, "Error updating expense");
      res.status(500).json({
        success: false,
        errors: ["Error updating expense", err.message],
      });
    }
  },

  async deleteExpense(req, res) {
    try {
      await ensureExpenseTable();
      const id = Number(req.params.id);
      const row = await db.store_expense.findByPk(id);
      if (!row) {
        return res.status(404).json({ success: false, errors: ["Expense not found"] });
      }
      await row.destroy();
      res.status(200).json({ success: true, msg: "Expense deleted" });
    } catch (err) {
      console.error(err, "Error deleting expense");
      res.status(500).json({
        success: false,
        errors: ["Error deleting expense", err.message],
      });
    }
  },
};
