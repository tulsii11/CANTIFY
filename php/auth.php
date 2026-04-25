<?php
require_once 'config.php';
setAPIHeaders();

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {

    // ─── REGISTER ────────────────────────────────────
    case 'register':
        $name     = trim($_POST['name'] ?? '');
        $email    = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$name || !$email || !$password) {
            jsonResponse(false, 'All fields are required');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(false, 'Invalid email address');
        }
        if (strlen($password) < 6) {
            jsonResponse(false, 'Password must be at least 6 characters');
        }

        // Determine role based on email domain
        $domain = strtolower(substr(strrchr($email, '@'), 1));
        $role = ($domain === 'charusat.edu.in' || $domain === 'charusat.ac.in') ? 'user' : 'admin';

        $db = getDB();

        // Check duplicate
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param('s', $email);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            jsonResponse(false, 'Email already registered');
        }
        $stmt->close();

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)");
        $stmt->bind_param('ssss', $name, $email, $hash, $role);

        if ($stmt->execute()) {
            $userId = $db->insert_id;
            $_SESSION['user_id'] = $userId;
            $_SESSION['name']    = $name;
            $_SESSION['email']   = $email;
            $_SESSION['role']    = $role;
            jsonResponse(true, 'Registration successful', ['role' => $role, 'name' => $name]);
        } else {
            jsonResponse(false, 'Registration failed');
        }
        break;

    // ─── LOGIN ───────────────────────────────────────
    case 'login':
        $email    = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$email || !$password) {
            jsonResponse(false, 'Email and password required');
        }

        $db = getDB();
        $stmt = $db->prepare("SELECT id, name, email, password, role FROM users WHERE email = ?");
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            jsonResponse(false, 'Invalid email or password');
        }

        $user = $result->fetch_assoc();
        if (!password_verify($password, $user['password'])) {
            jsonResponse(false, 'Invalid email or password');
        }

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['name']    = $user['name'];
        $_SESSION['email']   = $user['email'];
        $_SESSION['role']    = $user['role'];

        jsonResponse(true, 'Login successful', [
            'role'  => $user['role'],
            'name'  => $user['name'],
            'email' => $user['email']
        ]);
        break;

    // ─── LOGOUT ──────────────────────────────────────
    case 'logout':
        session_destroy();
        jsonResponse(true, 'Logged out');
        break;

    // ─── CHECK SESSION ───────────────────────────────
    case 'check':
        if (isset($_SESSION['user_id'])) {
            jsonResponse(true, 'Authenticated', [
                'user_id' => $_SESSION['user_id'],
                'name'    => $_SESSION['name'],
                'email'   => $_SESSION['email'],
                'role'    => $_SESSION['role']
            ]);
        } else {
            jsonResponse(false, 'Not authenticated');
        }
        break;

    default:
        jsonResponse(false, 'Invalid action');
}
?>
