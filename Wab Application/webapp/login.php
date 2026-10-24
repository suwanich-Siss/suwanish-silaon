<?php
session_start();
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/AuthController.php';

if (!empty($_SESSION['admin_id'])) {
    header('Location: dashboard.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (empty($email) || empty($password)) {
        $error = 'กรุณากรอก Email และ Password';
    } else {
        $auth = new AuthController();
        $result = $auth->login($email, $password);
        if ($result['success']) {
            header('Location: dashboard.php');
            exit;
        } else {
            $error = $result['message'];
        }
    }
}
?>

<html lang="th">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login - iande Admin</title>
    <link rel="stylesheet" href="assets/css/style.css" />
</head>

<body>
    <div class="login-page">
        <div class="login-bg-orb orb1"></div>
        <div class="login-bg-orb orb2"></div>

        <div class="login-split-container">
            <div class="login-left">
                <img src="assets/Logoapp.png" alt="T&E Logo" class="brand-hero-logo">
            </div>

            <div class="login-right">
                <div class="login-card">
                    <div class="login-logo">
                        <!--    Icon    -->
                        <div></div>
                        <h1>IandE Admin</h1>
                        <p>Income &amp; Expense Tracker - Control Panel</p>
                    </div>

                    <?php if ($error): ?>
                        <div class="login-error">
                            <!--    Icon    -->
                            <span></span>
                            <?= htmlspecialchars($error) ?>
                        </div>
                    <?php endif; ?>

                    <form action="" method="POST">
                        <div class="form-group">
                            <label for="email" class="form-label">Email Address</label>
                            <input type="email" name="email" id="email" class="form-control"
                                placeholder="admin@example.com" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>"
                                autocomplete="email" required />
                        </div>

                        <div class="form-group">
                            <label for="password" class="form-label">Password</label>
                            <input type="password" name="password" id="password" class="form-control"
                                placeholder="**********" autocomplete="current-password" required />
                        </div>
                        <button type="submit" class="btn btn-primary btn-full" style="margin-top:8px;">
                            Sign In
                        </button>
                    </form>
                    <p style="text-align:center;font-size:.78rem;color:var(--gray-500);margin-top:20px;">Protected area
                        -
                        Administrators only</p>
                </div>
            </div>
        </div>
    </div>
</body>

</html>