<?php
// users.php

session_start();
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth.php';
require_once __DIR__ . '/controllers/UserController.php';

requireLogin();

$ctrl   = new UserController();
$search = trim($_GET['search'] ?? '');
$page   = max(1, (int)($_GET['page'] ?? 1));
$result = $ctrl->getAll($search, $page, 15);
$stats  = $ctrl->getUserStats();

$users      = $result['data'];
$total      = $result['total'];
$lastPage   = $result['last_page'];
$perPage    = $result['per_page'];
$from       = ($page - 1) * $perPage + 1;
$to         = min($page * $perPage, $total);

// Chart data
$monthLabels = json_encode(array_column($stats['by_month'], 'month_label'));
$monthData   = json_encode(array_map('intval', array_column($stats['by_month'], 'total')));

$pageTitle   = 'Users';
$breadcrumb  = 'Home › User Management';
$currentPage = 'users';

ob_start();
?>

<!-- User Growth Chart -->
<div class="chart-grid cols-1" style="margin-bottom:20px;">
  <div class="chart-card">
    <div class="chart-card-header">
      <h3> User Growth — Last 12 Months</h3>
      <span class="badge-pill">Total: <?= number_format($total) ?> users</span>
    </div>
    <div class="chart-container" style="height:180px;">
      <canvas id="userGrowthChart"></canvas>
    </div>
  </div>
</div>

<!-- Users Table -->
<div class="table-card">
  <div class="table-card-header">
    <h3>All Users (<?= number_format($total) ?>)</h3>
    <form method="GET" action="" style="display:flex;gap:8px;">
      <div class="table-search">
        <input
          type="text"
          name="search"
          placeholder="Search by name or email…"
          value="<?= htmlspecialchars($search) ?>"
          style="width:240px;"
        />
      </div>
      <button type="submit" class="btn btn-primary btn-sm">Search</button>
      <?php if ($search): ?>
      <a href="/admin-panel/users.php" class="btn btn-ghost btn-sm">Clear</a>
      <?php endif; ?>
    </form>
  </div>

  <?php if (empty($users)): ?>
  <div class="empty-state">
    <div class="empty-icon">👤</div>
    <p>No users found<?= $search ? " for \"" . htmlspecialchars($search) . "\"" : '' ?></p>
  </div>
  <?php else: ?>
  <div style="overflow-x:auto;">
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:50px;">ID</th>
          <th>Name / Email</th>
          <th>Occupation</th>
          <th style="text-align:center;">Transactions</th>
          <th>Joined Date</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($users as $user): ?>
        <tr>
          <td style="color:var(--gray-500);font-size:.8rem;">#<?= $user['user_id'] ?></td>
          <td>
            <div class="user-meta">
              <span class="user-name"><?= htmlspecialchars($user['first_name'] . ' ' . $user['last_name']) ?></span>
              <span class="user-email"><?= htmlspecialchars($user['email']) ?></span>
            </div>
          </td>
          <td><?= htmlspecialchars($user['occupation'] ?? '—') ?></td>
          <td style="text-align:center;">
            <span class="badge badge-active"><?= number_format($user['tx_count']) ?> txns</span>
          </td>
          <td><?= date('d M Y', strtotime($user['created_at'])) ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  <div class="pagination">
    <div class="pagination-info">
      Showing <?= $from ?>–<?= $to ?> of <?= number_format($total) ?> users
    </div>
    <div class="pagination-btns">
      <a href="?page=<?= $page - 1 ?><?= $search ? '&search=' . urlencode($search) : '' ?>">
        <button class="page-btn" <?= $page <= 1 ? 'disabled' : '' ?>>‹</button>
      </a>
      <?php
      $startP = max(1, $page - 2);
      $endP   = min($lastPage, $page + 2);
      for ($p = $startP; $p <= $endP; $p++): ?>
        <a href="?page=<?= $p ?><?= $search ? '&search=' . urlencode($search) : '' ?>">
          <button class="page-btn <?= $p === $page ? 'active' : '' ?>"><?= $p ?></button>
        </a>
      <?php endfor; ?>
      <a href="?page=<?= $page + 1 ?><?= $search ? '&search=' . urlencode($search) : '' ?>">
        <button class="page-btn" <?= $page >= $lastPage ? 'disabled' : '' ?>>›</button>
      </a>
    </div>
  </div>
  <?php endif; ?>
</div>

<?php
$content = ob_get_clean();

$inlineScript = <<<JS
document.addEventListener('DOMContentLoaded', () => {
  buildUsersLineChart('userGrowthChart', {$monthLabels}, {$monthData});
});
JS;

require __DIR__ . '/views/header.php';
echo $content;
require __DIR__ . '/views/footer.php';
