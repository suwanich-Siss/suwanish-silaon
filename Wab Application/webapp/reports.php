<?php
// reports.php

session_start();
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth.php';
require_once __DIR__ . '/controllers/ReportController.php';

requireLogin();

$ctrl         = new ReportController();
$availYears   = $ctrl->getAvailableYears();
$currentYear  = (int)date('Y');
$currentMonth = (int)date('n');

// Ensure current year is always in the list
if (!in_array($currentYear, $availYears)) {
    array_unshift($availYears, $currentYear);
}

// Filter inputs
$reportType   = $_GET['type']  ?? 'monthly';
$selectedYear = (int)($_GET['year']  ?? $currentYear);
$selectedMonth= (int)($_GET['month'] ?? $currentMonth);

$monthlyReport = null;
$yearlyReport  = null;

if ($reportType === 'monthly') {
    $monthlyReport = $ctrl->getMonthlyReport($selectedYear, $selectedMonth);
} else {
    $yearlyReport = $ctrl->getYearlyReport($selectedYear);
}

// Prepare chart data for yearly
$yearlyIncomeData  = '[]';
$yearlyExpenseData = '[]';
$yearlyLabels      = '[]';
if ($yearlyReport) {
    $inc = []; $exp = [];
    foreach (range(1, 12) as $m) {
        $inc[] = $yearlyReport['monthly'][$m]['income']  ?? 0;
        $exp[] = $yearlyReport['monthly'][$m]['expense'] ?? 0;
    }
    $yearlyIncomeData  = json_encode($inc);
    $yearlyExpenseData = json_encode($exp);
    $yearlyLabels      = json_encode($yearlyReport['labels']);
}

// Monthly category chart data
$monthCatLabels = '[]';
$monthCatIncome = '[]';
$monthCatExpense= '[]';
if ($monthlyReport && !empty($monthlyReport['by_category'])) {
    $mIncome  = array_filter($monthlyReport['by_category'], fn($r) => $r['category_type'] === 'income');
    $mExpense = array_filter($monthlyReport['by_category'], fn($r) => $r['category_type'] === 'expense');
    $monthCatLabels  = json_encode(array_values(array_column($mExpense, 'category_name')));
    $monthCatExpense = json_encode(array_values(array_map('floatval', array_column($mExpense, 'total'))));
}

$monthNames = [
    1=>'January',2=>'February',3=>'March',4=>'April',
    5=>'May',6=>'June',7=>'July',8=>'August',
    9=>'September',10=>'October',11=>'November',12=>'December'
];

$pageTitle   = 'Financial Reports';
$breadcrumb  = 'Home › Reports';
$currentPage = 'reports';

ob_start();
?>

<!-- Report Filters -->
<div class="report-filters">
  <form method="GET" action="" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;width:100%;">
    <div style="display:flex;align-items:center;gap:8px;">
      <label>Report Type:</label>
      <select name="type" onchange="this.form.submit()">
        <option value="monthly" <?= $reportType === 'monthly' ? 'selected' : '' ?>>Monthly Report</option>
        <option value="yearly"  <?= $reportType === 'yearly'  ? 'selected' : '' ?>>Yearly Report</option>
      </select>
    </div>

    <?php if ($reportType === 'monthly'): ?>
    <div style="display:flex;align-items:center;gap:8px;">
      <label>Month:</label>
      <select name="month" onchange="this.form.submit()">
        <?php foreach ($monthNames as $n => $name): ?>
        <option value="<?= $n ?>" <?= $n === $selectedMonth ? 'selected' : '' ?>>
          <?= $name ?>
        </option>
        <?php endforeach; ?>
      </select>
    </div>
    <?php endif; ?>

    <div style="display:flex;align-items:center;gap:8px;">
      <label>Year:</label>
      <select name="year" onchange="this.form.submit()">
        <?php foreach ($availYears as $y): ?>
        <option value="<?= $y ?>" <?= $y === $selectedYear ? 'selected' : '' ?>><?= $y ?></option>
        <?php endforeach; ?>
      </select>
    </div>

  </form>
</div>

<?php if ($monthlyReport): ?>
<!-- ─── MONTHLY REPORT ─────────────────────────────────── -->
<div style="margin-bottom:8px;">
  <h2 style="font-size:1.1rem;color:var(--gray-300);font-weight:600;">
     Report for <?= $monthNames[$selectedMonth] ?> <?= $selectedYear ?>
  </h2>
</div>

<div class="report-summary-grid">
  <div class="report-summary-card">
    <div class="rs-label">Total Income(฿)</div>
    <div class="rs-value green"><?= number_format($monthlyReport['total_income'], 2) ?></div>
  </div>
  <div class="report-summary-card">
    <div class="rs-label">Total Expense</div>
    <div class="rs-value red"><?= number_format($monthlyReport['total_expense'], 2) ?></div>
  </div>
  <div class="report-summary-card">
    <div class="rs-label">Net Savings(฿)</div>
    <div class="rs-value <?= $monthlyReport['savings'] >= 0 ? 'green' : 'red' ?>">
      <?= $monthlyReport['savings'] >= 0 ? '+' : '' ?><?= number_format(abs($monthlyReport['savings']), 2) ?>
    </div>
  </div>
  <div class="report-summary-card">
    <div class="rs-label">Savings Rate</div>
    <div class="rs-value teal"><?= $monthlyReport['savings_rate'] ?>%</div>
  </div>
</div>

<!-- Monthly charts -->
<div class="chart-grid cols-2" style="margin-bottom:20px;">
  <div class="chart-card">
    <div class="chart-card-header">
      <h3> Income vs Expense</h3>
    </div>
    <div class="chart-container" style="height:260px;">
      <canvas id="monthPieChart"></canvas>
    </div>
  </div>
  <div class="chart-card">
    <div class="chart-card-header">
      <h3> Expense by Category</h3>
    </div>
    <div class="chart-container" style="height:260px;">
      <canvas id="monthCatChart"></canvas>
    </div>
  </div>
</div>

<!-- Monthly Category Breakdown Table -->
<?php if (!empty($monthlyReport['by_category'])): ?>
<div class="table-card">
  <div class="table-card-header">
    <h3> Category Breakdown</h3>
  </div>
  <div style="overflow-x:auto;">
    <table class="data-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Type</th>
          <th style="text-align:right;">Amount(฿)</th>
          <th style="text-align:right;">% of Total</th>
        </tr>
      </thead>
      <tbody>
        <?php
        $grandTotal = $monthlyReport['total_income'] + $monthlyReport['total_expense'];
        foreach ($monthlyReport['by_category'] as $row):
            $pct = $grandTotal > 0 ? round(($row['total'] / $grandTotal) * 100, 1) : 0;
        ?>
        <tr>
          <td class="td-main"><?= htmlspecialchars($row['category_name']) ?></td>
<td>
  <span class="badge badge-<?= $row['category_type'] ?>" style="display: inline-flex; align-items: center; gap: 4px;">
    
    <?php if ($row['category_type'] === 'income'): ?>
      <span class="material-symbols-rounded" style="font-size: 16px;">trending_up</span> Income
    <?php else: ?>
      <span class="material-symbols-rounded" style="font-size: 16px;">trending_down</span> Expense
    <?php endif; ?>
    
  </span>
</td>
          <td style="text-align:right;color:<?= $row['category_type'] === 'income' ? 'var(--green-500)' : 'var(--red-500)' ?>">
            <?= number_format($row['total'], 2) ?>
          </td>
          <td style="text-align:right;">
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;">
              <span style="font-size:.8rem;min-width:36px;text-align:right;" class="badge <?= $pct >= 0 ? 'badge-active' : 'badge-inactive' ?>"><?= $pct ?>%</span>
            </div>
          </td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
<?php endif; ?>

<?php elseif ($yearlyReport): ?>
<!-- ─── YEARLY REPORT ──────────────────────────────────── -->
<div style="margin-bottom:8px;">
  <h2 style="font-size:1.1rem;color:var(--gray-300);font-weight:600;">
    Annual Report for <?= $selectedYear ?>
  </h2>
</div>

<div class="report-summary-grid">
  <div class="report-summary-card">
    <div class="rs-label">Total Income(฿)</div>
    <div class="rs-value green"><?= number_format($yearlyReport['total_income'], 2) ?></div>
  </div>
  <div class="report-summary-card">
    <div class="rs-label">Total Expense(฿)</div>
    <div class="rs-value red"><?= number_format($yearlyReport['total_expense'], 2) ?></div>
  </div>
  <div class="report-summary-card">
    <div class="rs-label">Net Savings(฿)</div>
    <div class="rs-value <?= $yearlyReport['savings'] >= 0 ? 'green' : 'red' ?>">
      <?= $yearlyReport['savings'] >= 0 ? '+' : '' ?><?= number_format(abs($yearlyReport['savings']), 2) ?>
    </div>
  </div>
  <div class="report-summary-card">
    <div class="rs-label">Savings Rate</div>
    <div class="rs-value teal"><?= $yearlyReport['savings_rate'] ?>%</div>
  </div>
</div>

<div class="chart-card" style="margin-bottom:20px;">
  <div class="chart-card-header">
    <h3> Monthly Income vs Expense — <?= $selectedYear ?></h3>
  </div>
  <div class="chart-container" style="height:320px;">
    <canvas id="yearlyBarChart"></canvas>
  </div>
</div>

<!-- Monthly breakdown table -->
<div class="table-card">
  <div class="table-card-header">
    <h3> Monthly Breakdown</h3>
  </div>
  <div style="overflow-x:auto;">
    <table class="data-table">
      <thead>
        <tr>
          <th>Month</th>
          <th style="text-align:right;">Income(฿)</th>
          <th style="text-align:right;">Expense(฿)</th>
          <th style="text-align:right;">Savings(฿)</th>
          <th style="text-align:right;">Savings Rate</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach (range(1, 12) as $m):
            $inc = $yearlyReport['monthly'][$m]['income']  ?? 0;
            $exp = $yearlyReport['monthly'][$m]['expense'] ?? 0;
            $sav = $inc - $exp;
            $sr  = $inc > 0 ? round(($sav / $inc) * 100, 1) : 0;
        ?>
        <tr>
          <td class="td-main"><?= $monthNames[$m] ?></td>
          <td style="text-align:right;color:var(--green-400);"><?= number_format($inc, 2) ?></td>
          <td style="text-align:right;color:var(--base-100);"><?= number_format($exp, 2) ?></td>
          <td style="text-align:right;color:<?= $sav >= 0 ? 'var(--teal-400)' : 'var(--red-400)' ?>">
            <?= $sav >= 0 ? '+' : '-' ?><?= number_format(abs($sav), 2) ?>
          </td>
          <td style="text-align:right;">
            <span class="badge <?= $sr >= 0 ? 'badge-active' : 'badge-inactive' ?>"><?= $sr ?>%</span>
          </td>
        </tr>
        <?php endforeach; ?>
      </tbody>
      <tfoot>
        <tr style="border-top:2px solid rgba(255,255,255,.1);">
          <td class="td-main" style="font-family:'Syne',sans-serif; padding: 12px 16px 24px;">TOTAL</td>
          <td style="text-align:right;color:var(--green-400);font-weight:700; padding: 13px 16px ;"><?= number_format($yearlyReport['total_income'], 2) ?></td>
          <td style="text-align:right;color:var(--base-100);font-weight:700; padding: 13px 16px ;"> <?= number_format($yearlyReport['total_expense'], 2) ?></td>
          <td style="text-align:right;color:<?= $yearlyReport['savings'] >= 0 ? 'var(--teal-400)' : 'var(--red-400)' ?>;font-weight:700;padding: 13px 16px ;">
            <?= $yearlyReport['savings'] >= 0 ? '+' : '-' ?><?= number_format(abs($yearlyReport['savings']), 2) ?>
          </td>
          <td style="text-align:right;padding: 13px 16px ;">
            <span class="badge badge-active"><?= $yearlyReport['savings_rate'] ?>%</span>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>
<?php endif; ?>

<?php
$content = ob_get_clean();

$monthIncomeJs  = $monthlyReport['total_income']  ?? 0;
$monthExpenseJs = $monthlyReport['total_expense'] ?? 0;

$inlineScript = <<<JS
document.addEventListener('DOMContentLoaded', () => {
  // Monthly charts
  const mpCtx = document.getElementById('monthPieChart');
  if (mpCtx) {
    buildIncomeExpensePie('monthPieChart',
      {$monthIncomeJs},
      {$monthExpenseJs}
    );
  }
  const mcCtx = document.getElementById('monthCatChart');
  if (mcCtx) {
    buildExpenseBarChart('monthCatChart', {$monthCatLabels}, {$monthCatExpense});
  }
  // Yearly chart
  const yrCtx = document.getElementById('yearlyBarChart');
  if (yrCtx) {
    buildYearlyChart('yearlyBarChart', {$yearlyLabels}, {$yearlyIncomeData}, {$yearlyExpenseData});
  }
});
JS;

require __DIR__ . '/views/header.php';
echo $content;
require __DIR__ . '/views/footer.php';
