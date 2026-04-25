<?php
require_once 'config.php';
setAPIHeaders();

$action = $_GET['action'] ?? '';

switch ($action) {

    // ─── PLACE ORDER ─────────────────────────────────
    case 'place':
        requireLogin();
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) $data = $_POST;

        $items = $data['items'] ?? [];
        $total = floatval($data['total'] ?? 0);

        if (empty($items) || $total <= 0) {
            jsonResponse(false, 'Invalid order data');
        }

        $db = getDB();
        $userId = $_SESSION['user_id'];

        // Calculate prep time (max of all items + buffer)
        $itemIds = array_map(fn($i) => intval($i['id']), $items);
        $placeholders = implode(',', array_fill(0, count($itemIds), '?'));
        $types = str_repeat('i', count($itemIds));
        $stmt = $db->prepare("SELECT MAX(prep_time) as max_prep FROM menu_items WHERE id IN ($placeholders)");
        $stmt->bind_param($types, ...$itemIds);
        $stmt->execute();
        $prepRow = $stmt->get_result()->fetch_assoc();
        $pickupTime = ($prepRow['max_prep'] ?? 10) + 5;

        // Insert order
        $stmt = $db->prepare("INSERT INTO orders (user_id, total_amount, status, pickup_time) VALUES (?,?,'preparing',?)");
        $pickupStr = "Ready in $pickupTime minutes";
        $stmt->bind_param('ids', $userId, $total, $pickupStr);

        if (!$stmt->execute()) {
            jsonResponse(false, 'Failed to place order');
        }

        $orderId = $db->insert_id;

        // Insert order items
        foreach ($items as $item) {
            $itemId = intval($item['id']);
            $qty    = intval($item['quantity']);
            $price  = floatval($item['price']);
            $stmt2  = $db->prepare("INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?,?,?,?)");
            $stmt2->bind_param('iiid', $orderId, $itemId, $qty, $price);
            $stmt2->execute();
        }

        jsonResponse(true, 'Order placed successfully', [
            'order_id'    => $orderId,
            'pickup_time' => $pickupStr,
            'total'       => $total
        ]);
        break;

    // ─── GET MY ORDERS ────────────────────────────────
    case 'my_orders':
        requireLogin();
        $userId = $_SESSION['user_id'];
        $db = getDB();

        $stmt = $db->prepare("SELECT o.*, GROUP_CONCAT(CONCAT(oi.quantity,'x ',m.name) SEPARATOR ', ') as items_summary 
            FROM orders o 
            LEFT JOIN order_items oi ON o.id = oi.order_id 
            LEFT JOIN menu_items m ON oi.item_id = m.id 
            WHERE o.user_id = ? 
            GROUP BY o.id 
            ORDER BY o.created_at DESC");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $orders = [];
        while ($row = $result->fetch_assoc()) $orders[] = $row;
        jsonResponse(true, '', $orders);
        break;

    // ─── GET ORDER DETAIL ─────────────────────────────
    case 'detail':
        requireLogin();
        $orderId = intval($_GET['id'] ?? 0);
        if (!$orderId) jsonResponse(false, 'Order ID required');

        $db = getDB();
        $stmt = $db->prepare("SELECT oi.*, m.name, m.image_url FROM order_items oi LEFT JOIN menu_items m ON oi.item_id = m.id WHERE oi.order_id = ?");
        $stmt->bind_param('i', $orderId);
        $stmt->execute();
        $result = $stmt->get_result();
        $items = [];
        while ($row = $result->fetch_assoc()) $items[] = $row;
        jsonResponse(true, '', $items);
        break;

    // ─── GET ALL ORDERS (ADMIN) ───────────────────────
    case 'all_orders':
        requireAdmin();
        $db = getDB();
        $sql = "SELECT o.*, u.name as user_name, u.email as user_email,
                GROUP_CONCAT(CONCAT(oi.quantity,'x ',m.name) SEPARATOR ', ') as items_summary
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                LEFT JOIN menu_items m ON oi.item_id = m.id
                GROUP BY o.id
                ORDER BY o.created_at DESC";
        $result = $db->query($sql);
        $orders = [];
        while ($row = $result->fetch_assoc()) $orders[] = $row;
        jsonResponse(true, '', $orders);
        break;

    // ─── UPDATE ORDER STATUS (ADMIN) ──────────────────
    case 'update_status':
        requireAdmin();
        $data   = json_decode(file_get_contents('php://input'), true);
        $id     = intval($data['id'] ?? 0);
        $status = $data['status'] ?? '';

        $allowed = ['pending','preparing','ready','completed','cancelled'];
        if (!$id || !in_array($status, $allowed)) {
            jsonResponse(false, 'Invalid data');
        }

        $db = getDB();
        $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->bind_param('si', $status, $id);

        if ($stmt->execute()) {
            jsonResponse(true, 'Status updated');
        } else {
            jsonResponse(false, 'Failed to update status');
        }
        break;

    default:
        jsonResponse(false, 'Invalid action');
}
?>
