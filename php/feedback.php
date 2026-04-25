<?php
require_once 'config.php';
setAPIHeaders();

$action = $_GET['action'] ?? '';

switch ($action) {

    case 'submit':
        requireLogin();
        $data    = json_decode(file_get_contents('php://input'), true);
        $orderId = intval($data['order_id'] ?? 0);
        $rating  = intval($data['rating'] ?? 0);
        $review  = trim($data['review'] ?? '');
        $userId  = $_SESSION['user_id'];

        if (!$orderId || $rating < 1 || $rating > 5) {
            jsonResponse(false, 'Invalid feedback data');
        }

        $db = getDB();

        // Check if feedback already given
        $stmt = $db->prepare("SELECT id FROM feedback WHERE order_id = ? AND user_id = ?");
        $stmt->bind_param('ii', $orderId, $userId);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            jsonResponse(false, 'Feedback already submitted');
        }

        $stmt = $db->prepare("INSERT INTO feedback (order_id, user_id, rating, review) VALUES (?,?,?,?)");
        $stmt->bind_param('iiis', $orderId, $userId, $rating, $review);

        if ($stmt->execute()) {
            jsonResponse(true, 'Thank you for your feedback!');
        } else {
            jsonResponse(false, 'Failed to submit feedback');
        }
        break;

    case 'get_all':
        requireAdmin();
        $db = getDB();
        $sql = "SELECT f.*, u.name as user_name, o.total_amount FROM feedback f LEFT JOIN users u ON f.user_id = u.id LEFT JOIN orders o ON f.order_id = o.id ORDER BY f.created_at DESC";
        $result = $db->query($sql);
        $feedbacks = [];
        while ($row = $result->fetch_assoc()) $feedbacks[] = $row;
        jsonResponse(true, '', $feedbacks);
        break;

    default:
        jsonResponse(false, 'Invalid action');
}
?>
