<?php
// logout.php

session_start();
require_once __DIR__ . '/controllers/AuthController.php';

$auth = new AuthController();
$auth->logout();

header('Location: login.php?msg=logged_out');
exit;
