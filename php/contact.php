<?php
require_once 'config.php';
setAPIHeaders();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'submit':
        $name    = trim($_POST['name'] ?? '');
        $email   = trim($_POST['email'] ?? '');
        $message = trim($_POST['message'] ?? '');

        if (!$name || !$email || !$message) {
            jsonResponse(false, 'All fields are required');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(false, 'Invalid email address');
        }

        $db = getDB();
        $stmt = $db->prepare("INSERT INTO contacts (name, email, message) VALUES (?,?,?)");
        $stmt->bind_param('sss', $name, $email, $message);

        if ($stmt->execute()) {
            jsonResponse(true, 'Message sent successfully!');
        } else {
            jsonResponse(false, 'Failed to send message');
        }
        break;

    case 'get_all':
        requireAdmin();
        $db = getDB();
        $result = $db->query("SELECT * FROM contacts ORDER BY created_at DESC");
        $msgs = [];
        while ($row = $result->fetch_assoc()) $msgs[] = $row;
        jsonResponse(true, '', $msgs);
        break;

    default:
        jsonResponse(false, 'Invalid action');
}
?>
