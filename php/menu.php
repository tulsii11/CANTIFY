<?php
require_once 'config.php';
setAPIHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {

    // ─── GET ALL MENU ITEMS ──────────────────────────
    case 'get_all':
        $db = getDB();
        $sql = "SELECT m.*, c.name as category_name, c.icon as category_icon 
                FROM menu_items m 
                LEFT JOIN categories c ON m.category_id = c.id 
                WHERE m.is_available = 1 
                ORDER BY c.id, m.name";
        $result = $db->query($sql);
        $items = [];
        while ($row = $result->fetch_assoc()) $items[] = $row;
        jsonResponse(true, '', $items);
        break;

    // ─── GET BY CATEGORY ─────────────────────────────
    case 'get_by_category':
        $catId = intval($_GET['category_id'] ?? 0);
        $db = getDB();
        $stmt = $db->prepare("SELECT m.*, c.name as category_name FROM menu_items m LEFT JOIN categories c ON m.category_id = c.id WHERE m.category_id = ? AND m.is_available = 1");
        $stmt->bind_param('i', $catId);
        $stmt->execute();
        $result = $stmt->get_result();
        $items = [];
        while ($row = $result->fetch_assoc()) $items[] = $row;
        jsonResponse(true, '', $items);
        break;

    // ─── GET CATEGORIES ──────────────────────────────
    case 'get_categories':
        $db = getDB();
        $result = $db->query("SELECT * FROM categories ORDER BY id");
        $cats = [];
        while ($row = $result->fetch_assoc()) $cats[] = $row;
        jsonResponse(true, '', $cats);
        break;

    // ─── ADD ITEM (ADMIN) ─────────────────────────────
    case 'add':
        requireAdmin();
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) $data = $_POST;

        $name     = trim($data['name'] ?? '');
        $desc     = trim($data['description'] ?? '');
        $price    = floatval($data['price'] ?? 0);
        $catId    = intval($data['category_id'] ?? 0);
        $imageUrl = trim($data['image_url'] ?? '');
        $prepTime = intval($data['prep_time'] ?? 10);

        if (!$name || !$price || !$catId) {
            jsonResponse(false, 'Name, price and category are required');
        }

        $db = getDB();
        $stmt = $db->prepare("INSERT INTO menu_items (category_id, name, description, price, image_url, prep_time) VALUES (?,?,?,?,?,?)");
        $stmt->bind_param('issdsi', $catId, $name, $desc, $price, $imageUrl, $prepTime);

        if ($stmt->execute()) {
            jsonResponse(true, 'Item added successfully', ['id' => $db->insert_id]);
        } else {
            jsonResponse(false, 'Failed to add item');
        }
        break;

    // ─── UPDATE ITEM (ADMIN) ──────────────────────────
    case 'update':
        requireAdmin();
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) $data = $_POST;

        $id       = intval($data['id'] ?? 0);
        $name     = trim($data['name'] ?? '');
        $desc     = trim($data['description'] ?? '');
        $price    = floatval($data['price'] ?? 0);
        $catId    = intval($data['category_id'] ?? 0);
        $imageUrl = trim($data['image_url'] ?? '');
        $prepTime = intval($data['prep_time'] ?? 10);
        $avail    = intval($data['is_available'] ?? 1);

        if (!$id || !$name || !$price) {
            jsonResponse(false, 'ID, name and price are required');
        }

        $db = getDB();
        $stmt = $db->prepare("UPDATE menu_items SET name=?, description=?, price=?, category_id=?, image_url=?, prep_time=?, is_available=? WHERE id=?");
        $stmt->bind_param('ssdisiii', $name, $desc, $price, $catId, $imageUrl, $prepTime, $avail, $id);

        if ($stmt->execute()) {
            jsonResponse(true, 'Item updated successfully');
        } else {
            jsonResponse(false, 'Failed to update item');
        }
        break;

    // ─── DELETE ITEM (ADMIN) ──────────────────────────
    case 'delete':
        requireAdmin();
        $id = intval($_GET['id'] ?? 0);
        if (!$id) jsonResponse(false, 'Item ID required');

        $db = getDB();
        $stmt = $db->prepare("DELETE FROM menu_items WHERE id = ?");
        $stmt->bind_param('i', $id);

        if ($stmt->execute()) {
            jsonResponse(true, 'Item deleted');
        } else {
            jsonResponse(false, 'Failed to delete item');
        }
        break;

    // ─── GET ALL (ADMIN INCLUDES UNAVAILABLE) ─────────
    case 'admin_get_all':
        requireAdmin();
        $db = getDB();
        $sql = "SELECT m.*, c.name as category_name FROM menu_items m LEFT JOIN categories c ON m.category_id = c.id ORDER BY c.id, m.name";
        $result = $db->query($sql);
        $items = [];
        while ($row = $result->fetch_assoc()) $items[] = $row;
        jsonResponse(true, '', $items);
        break;

    default:
        jsonResponse(false, 'Invalid action');
}
?>
