import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generateExpenseReportPdf = async ({
  user,
  expenses = [],
  startDate,
  endDate,
  categorySummary = {},
  totalAmount = 0,
}) => {
  const dateRangeStr =
    startDate && endDate ? `${startDate} to ${endDate}` : `All Records as of ${new Date().toLocaleDateString()}`;

  const rowsHtml = expenses
    .map(
      (item, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${item.date}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #1e293b;">${
        item.itemName
      }</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">${
        item.category
      }</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">${
        item.paymentMethod || 'UPI'
      }</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; text-align: right; color: #0f172a;">$${Number(
        item.amount
      ).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const categoryCardsHtml = Object.entries(categorySummary)
    .map(
      ([cat, amt]) => `
      <div style="flex: 1; min-width: 140px; background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin: 4px;">
        <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">${cat}</div>
        <div style="font-size: 18px; color: #1e293b; font-weight: 800; margin-top: 4px;">$${Number(amt).toFixed(2)}</div>
      </div>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Student Expense & Purchase Statement</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            padding: 30px;
            margin: 0;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .title {
            font-size: 26px;
            font-weight: 800;
            color: #1e1b4b;
            margin: 0;
          }
          .subtitle {
            font-size: 13px;
            color: #64748b;
            margin-top: 4px;
          }
          .badge {
            background-color: #e0e7ff;
            color: #4338ca;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
          }
          .student-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
          }
          .student-info p {
            margin: 4px 0;
            font-size: 13px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          th {
            background-color: #6366f1;
            color: #ffffff;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 12px;
            text-align: left;
          }
          th:last-child {
            text-align: right;
          }
          .total-box {
            display: flex;
            justify-content: flex-end;
            margin-top: 24px;
          }
          .total-inner {
            background-color: #1e1b4b;
            color: #ffffff;
            padding: 16px 28px;
            border-radius: 8px;
            text-align: right;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">SkillTracker Expenses</h1>
            <div class="subtitle">Official Student Purchase & Expense Statement</div>
          </div>
          <div class="badge">PERIOD: ${dateRangeStr}</div>
        </div>

        <div class="student-card">
          <div class="student-info">
            <p><strong>Student Name:</strong> ${user?.name || 'Student'}</p>
            <p><strong>Email:</strong> ${user?.email || 'N/A'}</p>
            <p><strong>College:</strong> ${user?.college || 'N/A'}</p>
          </div>
          <div class="student-info" style="text-align: right;">
            <p><strong>Department:</strong> ${user?.department || 'N/A'}</p>
            <p><strong>Academic Year:</strong> ${user?.year || 'N/A'}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>

        ${
          categoryCardsHtml
            ? `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 8px;">CATEGORY BREAKDOWN</div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${categoryCardsHtml}
            </div>
          </div>
        `
            : ''
        }

        <table>
          <thead>
            <tr>
              <th style="border-radius: 6px 0 0 0;">Date</th>
              <th>Item / Description</th>
              <th>Category</th>
              <th>Payment</th>
              <th style="border-radius: 0 6px 0 0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${
              rowsHtml ||
              `<tr><td colspan="5" style="text-align:center; padding: 24px; color: #94a3b8;">No expense records found.</td></tr>`
            }
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-inner">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #c7d2fe;">Total Cumulative Expenditure</div>
            <div style="font-size: 28px; font-weight: 900; margin-top: 4px;">$${Number(totalAmount).toFixed(2)}</div>
          </div>
        </div>

        <div class="footer">
          Generated automatically by SkillTracker App • Verified Student Academic & Productivity Suite
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    return uri;
  } catch (error) {
    console.error('Error printing PDF:', error);
    throw error;
  }
};

export const sharePdf = async (fileUri) => {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Expense Report PDF',
      });
    } else {
      alert('Sharing is not available on this platform');
    }
  } catch (error) {
    console.error('Error sharing PDF:', error);
  }
};

export const printPdfDirectly = async (html) => {
  try {
    await Print.printAsync({ html });
  } catch (error) {
    console.error('Direct print error:', error);
  }
};

export default {
  generateExpenseReportPdf,
  sharePdf,
  printPdfDirectly,
};
