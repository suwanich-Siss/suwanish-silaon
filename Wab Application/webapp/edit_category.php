<?php
// edit_category.php

session_start();
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth.php';
require_once __DIR__ . '/controllers/CategoryController.php';

requireLogin();

$ctrl = new CategoryController();
$id   = (int)($_GET['id'] ?? 0);

if (!$id) {
    header('Location: categories.php');
    exit;
}

$category = $ctrl->getById($id);
if (!$category) {
    header('Location: categories.php?error=' . urlencode('Category not found'));
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name     = trim($_POST['category_name'] ?? '');
    $type     = trim($_POST['category_type'] ?? '');
    $isActive = isset($_POST['is_active']) ? 1 : 0;

    $result = $ctrl->update($id, $name, $type, $isActive);
    if ($result['success']) {
        header('Location: categories.php?msg=updated');
        exit;
    }
    $error = $result['message'];
}

// Use POST values if re-rendering form after error, else DB values
$formName   = $_POST['category_name'] ?? $category['category_name'];
$formType   = $_POST['category_type'] ?? $category['category_type'];
$formActive = isset($_POST['is_active']) ? (bool)$_POST['is_active'] : (bool)$category['is_active'];

$pageTitle   = 'Edit Category';
$breadcrumb  = 'Home › Categories › Edit';
$currentPage = 'categories';

ob_start();
?>

<?php if ($error): ?>
<div class="alert alert-danger">❌ <?= htmlspecialchars($error) ?></div>
<?php endif; ?>

<div class="form-card">
  <h2>✏️ Edit Category <span style="color:var(--teal-400);font-size:.85rem;font-weight:500;">#<?= $id ?></span></h2>

  <form method="POST" action="">
    <div class="form-group">
      <label class="form-label" for="category_name">Category Name <span style="color:var(--red-400)">*</span></label>
      <input
        id="category_name"
        name="category_name"
        type="text"
        class="form-control"
        placeholder="e.g. อาหาร, เงินเดือน"
        value="<?= htmlspecialchars($formName) ?>"
        required
      />
    </div>

    <div class="form-group">
      <label class="form-label" for="category_type">Category Type <span style="color:var(--red-400)">*</span></label>
      <select id="category_type" name="category_type" class="form-control" required>
        <option value="">— Select type —</option>
        <option value="income"  <?= $formType === 'income'  ? 'selected' : '' ?>>📈 Income</option>
        <option value="expense" <?= $formType === 'expense' ? 'selected' : '' ?>>📉 Expense</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label" style="display:flex;align-items:center;gap:10px;cursor:pointer;">
        <input
          type="checkbox"
          name="is_active"
          value="1"
          <?= $formActive ? 'checked' : '' ?>
          style="width:16px;height:16px;accent-color:var(--teal-400);"
        />
        <span>Active (visible to users)</span>
      </label>
    </div>

    <div class="form-actions">
      <button type="submit" class="btn btn-primary">Update Category</button>
      <a href="categories.php" class="btn btn-ghost">Cancel</a>
    </div>
  </form>
</div>

<?php
$content = ob_get_clean();
require __DIR__ . '/views/header.php';
echo $content;
require __DIR__ . '/views/footer.php';
