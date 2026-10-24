<?php
// views/layout/sidebar.php

$currentPage = $currentPage ?? '';
$admin       = getCurrentAdmin();
$initials    = strtoupper(substr($admin['name'], 0, 1));

$navItems = [
    'dashboard'  => ['icon' => 'dashboard',  'label' => 'Dashboard',  'href' => 'dashboard.php'],
    'categories' => ['icon' => 'sell',       'label' => 'Categories', 'href' => 'categories.php'],
    'reports'    => ['icon' => 'bar_chart',  'label' => 'Reports',    'href' => 'reports.php'],
];
?>
<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo">
    <div class="logo-icon">
      <img src="assets/Logoapp.png" alt="T&E Logo" >
    </div>
    <div class="logo-text">
      <div class="title">iande</div>
      <div class="subtitle">Admin Panel</div>
    </div>
  </div>

  <nav class="sidebar-nav">
    <div class="nav-section-label">Main Menu</div>

    <?php foreach ($navItems as $key => $item): ?>
    <a href="<?= $item['href'] ?>" class="nav-item <?= $currentPage === $key ? 'active' : '' ?>">
      <span class="nav-icon material-symbols-rounded"><?= $item['icon'] ?></span>
      <?= $item['label'] ?>
    </a>
    <?php endforeach; ?>

    <div class="divider" style="margin:16px 0 8px;"></div>
    <div class="nav-section-label">Account</div>

    <a href="logout.php" class="nav-item logout">
      <span class="material-symbols-rounded">logout</span>
      Logout
    </a>
  </nav>


</aside>