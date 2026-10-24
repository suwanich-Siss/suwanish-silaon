<?php
// views/layout/header.php

$pageTitle  = $pageTitle  ?? 'Admin Panel';
$breadcrumb = $breadcrumb ?? 'Admin Panel';
?>
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><?= htmlspecialchars($pageTitle) ?> — iande Admin</title>
  <link rel="stylesheet" href="assets/css/style.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
</head>
<body>
<?php require __DIR__ . '/sidebar.php'; ?>

<div class="main-wrapper">
  <header class="topbar">
    <div class="topbar-left">
      <span class="breadcrumb"><?= htmlspecialchars($breadcrumb) ?></span>
      <h1 class="page-title"><?= htmlspecialchars($pageTitle) ?></h1>
    </div>
    <div class="topbar-right">
      <div class="topbar-date" id="topbarDate"></div>
    </div>
  </header>

  <main class="content-area">
