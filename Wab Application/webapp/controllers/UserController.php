<?php
// controllers/UserController.php

require_once __DIR__ . '/../config/database.php';

class UserController {

    public function getAll(string $search = '', int $page = 1, int $perPage = 15): array {
        $db     = Database::getConnection();
        $offset = ($page - 1) * $perPage;
        $where  = "WHERE role = 'user'";
        $params = [];

        if ($search !== '') {
            $where  .= " AND (first_name LIKE :s1 OR last_name LIKE :s2 OR email LIKE :s3)";
            $searchTerm = '%' . $search . '%';
            $params[':s1'] = $searchTerm;
            $params[':s2'] = $searchTerm;
            $params[':s3'] = $searchTerm;
        }

        $total = $db->prepare("SELECT COUNT(*) FROM users $where");
        $total->execute($params);
        $count = (int)$total->fetchColumn();

        $params[':limit']  = $perPage;
        $params[':offset'] = $offset;
        $stmt = $db->prepare(
            "SELECT user_id, first_name, last_name, email, occupation, created_at,
                    (SELECT COUNT(*) FROM `transaction` WHERE user_id = users.user_id) AS tx_count
             FROM users $where
             ORDER BY created_at DESC
             LIMIT :limit OFFSET :offset"
        );
        $stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
        foreach ($params as $k => $v) {
            if ($k !== ':limit' && $k !== ':offset') $stmt->bindValue($k, $v);
        }
        $stmt->execute();

        return [
            'data'       => $stmt->fetchAll(),
            'total'      => $count,
            'page'       => $page,
            'per_page'   => $perPage,
            'last_page'  => (int)ceil($count / $perPage),
        ];
    }

    public function getUserStats(): array {
        $db = Database::getConnection();

        $byMonth = $db->query(
            "SELECT DATE_FORMAT(created_at,'%Y-%m') AS month_key,
                    DATE_FORMAT(created_at,'%b %Y')  AS month_label,
                    COUNT(*) AS total
             FROM users
             WHERE role='user' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
             GROUP BY month_key, month_label ORDER BY month_key"
        )->fetchAll();

        return ['by_month' => $byMonth];
    }
}
