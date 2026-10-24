<?php
// add_category.php

session_start();
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth.php';
require_once __DIR__ . '/controllers/CategoryController.php';

requireLogin();

$ctrl  = new CategoryController();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['category_name'] ?? '');
    $type = trim($_POST['category_type'] ?? '');

    $result = $ctrl->create($name, $type);
    if ($result['success']) {
        header('Location: categories.php?msg=created');
        exit;
    }
    $error = $result['message'];
}

$pageTitle   = 'Add Category';
$breadcrumb  = 'Home › Categories › Add';
$currentPage = 'categories';

ob_start();
?>

<?php if ($error): ?>
<div class="alert alert-danger">❌ <?= htmlspecialchars($error) ?></div>
<?php endif; ?>

<div class="form-card">
  <h2>➕ Add New Category</h2>

  <form method="POST" action="">
    <div class="form-group">
      <label class="form-label" for="category_name">Category Name <span style="color:var(--red-400)">*</span></label>
      <input
        id="category_name"
        name="category_name"
        type="text"
        class="form-control"
        placeholder="e.g. อาหาร, เงินเดือน"
        value="<?= htmlspecialchars($_POST['category_name'] ?? '') ?>"
        required
      />
    </div>

    <div class="form-group">
      <label class="form-label" for="category_type">Category Type <span style="color:var(--red-400)">*</span></label>
      <select id="category_type" name="category_type" class="form-control" required>
        <option value="">— Select type —</option>
        <option value="income"  <?= ($_POST['category_type'] ?? '') === 'income'  ? 'selected' : '' ?>>📈 Income</option>
        <option value="expense" <?= ($_POST['category_type'] ?? '') === 'expense' ? 'selected' : '' ?>>📉 Expense</option>
      </select>
    </div>

    <div class="form-actions">
      <button type="submit" class="btn btn-primary">Save Category</button>
      <a href="categories.php" class="btn btn-ghost">Cancel</a>
    </div>
  </form>
</div>

<?php
$content = ob_get_clean();
require __DIR__ . '/views/header.php';
echo $content;
require __DIR__ . '/views/footer.php';
