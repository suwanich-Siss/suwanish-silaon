<?php
// categories.php

session_start();
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth.php';
require_once __DIR__ . '/controllers/CategoryController.php';

requireLogin();

$ctrl = new CategoryController();

// Handle toggle status
if (isset($_GET['toggle']) && is_numeric($_GET['toggle'])) {
  $ctrl->toggleStatus((int) $_GET['toggle']);
  header('Location: categories.php?msg=toggled');
  exit;
}

// Handle delete (Soft Delete — set is_active = 0)
if (isset($_GET['delete']) && is_numeric($_GET['delete'])) {
  $result = $ctrl->delete((int) $_GET['delete']);
  $q = $result['success'] ? 'msg=deleted' : 'error=' . urlencode($result['message']);
  header("Location: categories.php?$q");
  exit;
}

$pageIncome = isset($_GET['page_inc']) ? max(1, (int)$_GET['page_inc']) : 1;
$pageExpense = isset($_GET['page_exp']) ? max(1, (int)$_GET['page_exp']) : 1;

$limit = 3;
$data = $ctrl->getPaginatedCategories($pageIncome, $pageExpense, $limit);

$incomes = $data['incomes'];
$expenses = $data['expenses'];
$totalPageIncome = $data['totalPageIncome'];
$totalPageExpense = $data['totalPageExpense'];
$totalCount = count($incomes) + count($expenses);

$currentVersion = $ctrl->getCategoryVersion(); // ดึง category_version ปัจจุบัน
$pageTitle = 'Categories';
$breadcrumb = 'Home › Category Management';
$currentPage = 'categories';

$msg = $_GET['msg'] ?? ''; // ดึงข้อความแจ้งเตือนสำเร็จ (ถ้ามี)
$error = $_GET['error'] ?? ''; // ดึงข้อความแจ้งเตือนผิดพลาด (ถ้ามี)

ob_start();
?>

<!-- Flash messages -->
<?php if ($msg === 'created'): ?>
  <div class="alert alert-success" data-auto-dismiss="4000"> <span class="material-symbols-rounded"
      style="vertical-align: middle; font-size: 20px;">check_circle</span>
    Category created successfully</div>
<?php elseif ($msg === 'updated'): ?>
  <div class="alert alert-success" data-auto-dismiss="4000"> <span class="material-symbols-rounded"
      style="vertical-align: middle; font-size: 20px;">check_circle</span>
    Category updated successfully</div>
<?php elseif ($msg === 'deleted'): ?>
  <div class="alert alert-success" data-auto-dismiss="4000"> <span class="material-symbols-rounded"
      style="vertical-align: middle; font-size: 20px;">delete</span>
    Category deleted successfully</div>
<?php elseif ($msg === 'published'): ?>
  <div class="alert alert-success" data-auto-dismiss="5000"> <span class="material-symbols-rounded"
      style="vertical-align: middle; font-size: 20px;">publish</span>
    Published! Category version updated to <strong>v<?= (int) ($_GET['version'] ?? 0) ?></strong> — Mobile apps will sync
    on next check</div>
<?php elseif ($msg === 'toggled'): ?>
  <div class="alert alert-info" data-auto-dismiss="3000"> <span class="material-symbols-rounded"
      style="vertical-align: middle; font-size: 20px;">sync</span>
    Category status updated</div>
<?php endif; ?>

<?php if ($error): ?>
  <div class="alert alert-danger" data-auto-dismiss="6000"> <span class="material-symbols-rounded"
      style="vertical-align: middle; font-size: 20px;">error</span> <?= htmlspecialchars($error) ?></div>
<?php endif; ?>

<div class="table-card">
  <div class="table-card-header">
    <h3>🏷️ All Categories </h3>
    <div style="display:flex;gap:10px;align-items:center;">
      <div class="table-search">
        <input id="catSearch" type="text" placeholder="Search categories..." />
      </div>

      <button class="btn btn-sm"
        style="background:var(--teal-400);color:#fff;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;"
        data-delete-url="categories.php?publish=1" data-delete-msg=<?= json_encode('ต้องการอัปเดตหมวดหมู่เลยไหม? การทำแบบนี้จะทำให้มือถือซิงค์อัตโนมัติ', JSON_UNESCAPED_UNICODE) ?> data-modal-title="Confirm Publish"
        data-modal-icon="publish" data-confirm-label="Publish" id="publishBtn">
        <span class="material-symbols-rounded" style="font-size:16px;">publish</span>
        Publish Update
      </button>
      <a href="add_category.php" class="btn btn-primary btn-sm">
        + Add Category
      </a>
    </div>
  </div>

  <?php if (empty($incomes) && empty($expenses)): ?>
    <div class="empty-state">
      <div class="empty-icon">🏷️</div>
      <p>No categories found. <a href="add_category.php" style="color:var(--teal-400)">Add the first one</a></p>
    </div>
  <?php else: ?>
<!-- ==================== ส่วนตารางรายรับ (Income) ==================== -->
    <?php if (!empty($incomes)): ?>
      <h4 style="padding: 15px 20px 5px; color: var(--teal-600); margin: 0;">รายรับ (Income)</h4>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th style="text-align:center;">Type</th>
              <th>Created Date</th>
              <th style="text-align:center;">Status</th>
              <th style="text-align:center; width:140px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($incomes as $cat): ?>
              <tr>
                <td class="td-main"><?= htmlspecialchars($cat['category_name']) ?></td>
                <td style="text-align:center;">
                  <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;background:#d1fae5;color:#065f46;">
                    <span class="material-symbols-rounded" style="font-size:14px;">trending_up</span>
                    INCOME
                  </span>
                </td>
                <td><?= date('d M Y', strtotime($cat['created_at'])) ?></td>
                <td style="text-align:center;">
                  <span class="badge <?= $cat['is_active'] ? 'badge-active' : 'badge-inactive' ?>" style="display: inline-flex; align-items: center; gap: 4px;">
                    <span class="material-symbols-rounded" style="font-size: 14px;"><?= $cat['is_active'] ? 'check_circle' : 'radio_button_unchecked' ?></span>
                    <?= $cat['is_active'] ? 'Active' : 'Inactive' ?>
                  </span>
                </td>
                <td style="text-align:center;">
                  <div class="action-btns" style="justify-content:center; display: flex; gap: 5px;">
                    <a href="edit_category.php?id=<?= $cat['category_id'] ?>" class="btn-icon edit" data-tooltip="Edit"><span class="material-symbols-rounded" style="font-size: 20px;">edit</span></a>
                    <button class="btn-icon toggle" data-tooltip="<?= $cat['is_active'] ? 'Deactivate' : 'Activate' ?>" onclick="window.location='categories.php?toggle=<?= $cat['category_id'] ?>'"><span class="material-symbols-rounded" style="font-size: 20px;"><?= $cat['is_active'] ? 'lock' : 'lock_open' ?></span></button>
                    <button class="btn-icon del" data-tooltip="Delete" data-delete-url="categories.php?delete=<?= $cat['category_id'] ?>" data-delete-msg="ลบหมวดหมู่ &quot;<?= htmlspecialchars($cat['category_name'], ENT_QUOTES) ?>&quot; คุณต้องการลบหรือไม่?" data-modal-icon="delete"><span class="material-symbols-rounded" style="font-size: 20px;">delete</span></button>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination สำหรับ รายรับ -->
      <?php if ($totalPageIncome > 1):
        $window = 2;
        $incStart = max(1, $pageIncome - $window);
        $incEnd   = min($totalPageIncome, $pageIncome + $window);
      ?>
        <div style="padding: 10px 20px; display: flex; justify-content: flex-end; gap: 5px; align-items: center;">
          <?php if ($pageIncome > 1): ?>
            <a href="categories.php?page_inc=<?= $pageIncome - 1 ?>&page_exp=<?= $pageExpense ?>" class="btn btn-sm" style="background:#eee;color:#333;padding:2px 8px;">‹</a>
          <?php endif; ?>

          <?php if ($incStart > 1): ?>
            <a href="categories.php?page_inc=1&page_exp=<?= $pageExpense ?>" class="btn btn-sm" style="background:#eee;color:#333;padding:2px 8px;">1</a>
            <?php if ($incStart > 2): ?><span style="padding:2px 4px;color:#999;">…</span><?php endif; ?>
          <?php endif; ?>

          <?php for ($i = $incStart; $i <= $incEnd; $i++): ?>
            <a href="categories.php?page_inc=<?= $i ?>&page_exp=<?= $pageExpense ?>" class="btn btn-sm"
               style="background:<?= $i == $pageIncome ? 'var(--teal-400)' : '#eee' ?>; color:<?= $i == $pageIncome ? '#fff' : '#333' ?>; padding: 2px 8px;">
              <?= $i ?>
            </a>
          <?php endfor; ?>

          <?php if ($incEnd < $totalPageIncome): ?>
            <?php if ($incEnd < $totalPageIncome - 1): ?><span style="padding:2px 4px;color:#999;">…</span><?php endif; ?>
            <a href="categories.php?page_inc=<?= $totalPageIncome ?>&page_exp=<?= $pageExpense ?>" class="btn btn-sm" style="background:#eee;color:#333;padding:2px 8px;"><?= $totalPageIncome ?></a>
          <?php endif; ?>

          <?php if ($pageIncome < $totalPageIncome): ?>
            <a href="categories.php?page_inc=<?= $pageIncome + 1 ?>&page_exp=<?= $pageExpense ?>" class="btn btn-sm" style="background:#eee;color:#333;padding:2px 8px;">›</a>
          <?php endif; ?>
        </div>
      <?php endif; ?>
    <?php endif; // สิ้นสุดถ้ามีข้อมูลรายรับ ?>


    <!-- ==================== ส่วนตารางรายจ่าย (Expense) ==================== -->
    <?php if (!empty($expenses)): ?>
      <h4 style="padding: 15px 20px 5px; color: var(--red-500); margin-top: 15px; border-top: 1px solid #eee;">รายจ่าย (Expense)</h4>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th style="text-align:center;">Type</th>
              <th>Created Date</th>
              <th style="text-align:center;">Status</th>
              <th style="text-align:center; width:140px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($expenses as $cat): ?>
              <tr>
                <td class="td-main"><?= htmlspecialchars($cat['category_name']) ?></td>
                <td style="text-align:center;">
                  <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;background:#fee2e2;color:#991b1b;">
                    <span class="material-symbols-rounded" style="font-size:14px;">trending_down</span>
                    EXPENSE
                  </span>
                </td>
                <td><?= date('d M Y', strtotime($cat['created_at'])) ?></td>
                <td style="text-align:center;">
                  <span class="badge <?= $cat['is_active'] ? 'badge-active' : 'badge-inactive' ?>" style="display: inline-flex; align-items: center; gap: 4px;">
                    <span class="material-symbols-rounded" style="font-size: 14px;"><?= $cat['is_active'] ? 'check_circle' : 'radio_button_unchecked' ?></span>
                    <?= $cat['is_active'] ? 'Active' : 'Inactive' ?>
                  </span>
                </td>
                <td style="text-align:center;">
                  <div class="action-btns" style="justify-content:center; display: flex; gap: 5px;">
                    <a href="edit_category.php?id=<?= $cat['category_id'] ?>" class="btn-icon edit" data-tooltip="Edit"><span class="material-symbols-rounded" style="font-size: 20px;">edit</span></a>
                    <button class="btn-icon toggle" data-tooltip="<?= $cat['is_active'] ? 'Deactivate' : 'Activate' ?>" onclick="window.location='categories.php?toggle=<?= $cat['category_id'] ?>'"><span class="material-symbols-rounded" style="font-size: 20px;"><?= $cat['is_active'] ? 'lock' : 'lock_open' ?></span></button>
                    <button class="btn-icon del" data-tooltip="Delete" data-delete-url="categories.php?delete=<?= $cat['category_id'] ?>" data-delete-msg="ลบหมวดหมู่ &quot;<?= htmlspecialchars($cat['category_name'], ENT_QUOTES) ?>&quot; คุณต้องการลบหรือไม่?" data-modal-icon="delete"><span class="material-symbols-rounded" style="font-size: 20px;">delete</span></button>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>

      <!-- Pagination สำหรับ รายจ่าย -->
      <?php if ($totalPageExpense > 1):
        $window = 2;
        $expStart = max(1, $pageExpense - $window);
        $expEnd   = min($totalPageExpense, $pageExpense + $window);
      ?>
        <div style="padding: 10px 20px; display: flex; justify-content: flex-end; gap: 5px; align-items: center;">

          <?php if ($pageExpense > 1): ?>
            <a href="categories.php?page_inc=<?= $pageIncome ?>&page_exp=<?= $pageExpense - 1 ?>" class="btn btn-sm" style="background:#eee;color:#333;padding:2px 8px;">‹</a>
          <?php endif; ?>

          <?php if ($expStart > 1): ?>
            <a href="categories.php?page_inc=<?= $pageIncome ?>&page_exp=1" class="btn btn-sm" style="background:#eee;color:#333;padding:2px 8px;">1</a>
            <?php if ($expStart > 2): ?><span style="padding:2px 4px;color:#999;">…</span><?php endif; ?>
          <?php endif; ?>

          <?php for ($i = $expStart; $i <= $expEnd; $i++): ?>
            <a href="categories.php?page_inc=<?= $pageIncome ?>&page_exp=<?= $i ?>" class="btn btn-sm"
               style="background:<?= $i == $pageExpense ? 'var(--teal-400)' : '#eee' ?>; color:<?= $i == $pageExpense ? '#fff' : '#333' ?>; padding: 2px 8px;">
              <?= $i ?>
            </a>
          <?php endfor; ?>

          <?php if ($expEnd < $totalPageExpense): ?>
            <?php if ($expEnd < $totalPageExpense - 1): ?><span style="padding:2px 4px;color:#999;">…</span><?php endif; ?>
            <a href="categories.php?page_inc=<?= $pageIncome ?>&page_exp=<?= $totalPageExpense ?>" class="btn btn-sm" style="background:#eee;color:#333;padding:2px 8px;"><?= $totalPageExpense ?></a>
          <?php endif; ?>

          <?php if ($pageExpense < $totalPageExpense): ?>
            <a href="categories.php?page_inc=<?= $pageIncome ?>&page_exp=<?= $pageExpense + 1 ?>" class="btn btn-sm" style="background:#eee;color:#333;padding:2px 8px;">›</a>
          <?php endif; ?>
        </div>
      <?php endif; ?>
    <?php endif; // สิ้นสุดถ้ามีข้อมูลรายจ่าย ?>

  <?php endif; ?>
</div>

<?php
$content = ob_get_clean();
$inlineScript = "document.addEventListener('DOMContentLoaded',()=>initTableSearch('catSearch','catTable'));";

require __DIR__ . '/views/header.php';
echo $content;
require __DIR__ . '/views/footer.php';
