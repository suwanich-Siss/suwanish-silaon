<?php
// controllers/ReportController.php

require_once __DIR__ . '/../config/database.php';

class ReportController {

    public function getMonthlyReport(int $year, int $month): array {
        $db = Database::getConnection();

        $income = $db->prepare(
            "SELECT COALESCE(SUM(t.amount),0) FROM `transaction` t
             JOIN category c ON t.category_id = c.category_id
             WHERE c.category_type='income'
               AND YEAR(t.transaction_date)=? AND MONTH(t.transaction_date)=?"
        );
        $income->execute([$year, $month]);
        $inc = (float)$income->fetchColumn();

        $expense = $db->prepare(
            "SELECT COALESCE(SUM(t.amount),0) FROM `transaction` t
             JOIN category c ON t.category_id = c.category_id
             WHERE c.category_type='expense'
               AND YEAR(t.transaction_date)=? AND MONTH(t.transaction_date)=?"
        );
        $expense->execute([$year, $month]);
        $exp = (float)$expense->fetchColumn();

        $byCategory = $db->prepare(
            "SELECT c.category_name, c.category_type, COALESCE(SUM(t.amount),0) AS total
             FROM `transaction` t
             JOIN category c ON t.category_id = c.category_id
             WHERE YEAR(t.transaction_date)=? AND MONTH(t.transaction_date)=?
             GROUP BY c.category_id, c.category_name, c.category_type
             ORDER BY c.category_type, total DESC"
        );
        $byCategory->execute([$year, $month]);

        $savings     = $inc - $exp;
        $savingsRate = $inc > 0 ? round(($savings / $inc) * 100, 2) : 0;

        return [
            'year'          => $year,
            'month'         => $month,
            'total_income'  => $inc,
            'total_expense' => $exp,
            'savings'       => $savings,
            'savings_rate'  => $savingsRate,
            'by_category'   => $byCategory->fetchAll(),
        ];
    }

    public function getYearlyReport(int $year): array {
        $db = Database::getConnection();

        $monthly = $db->prepare(
            "SELECT MONTH(t.transaction_date) AS month_num,
                    DATE_FORMAT(t.transaction_date,'%b') AS month_label,
                    c.category_type,
                    COALESCE(SUM(t.amount),0) AS total
             FROM `transaction` t
             JOIN category c ON t.category_id = c.category_id
             WHERE YEAR(t.transaction_date)=?
             GROUP BY month_num, month_label, c.category_type
             ORDER BY month_num"
        );
        $monthly->execute([$year]);
        $rows = $monthly->fetchAll();

        $months  = array_fill(1, 12, ['income' => 0, 'expense' => 0]);
        $labels  = [];
        foreach ($rows as $r) {
            $months[$r['month_num']][$r['category_type']] = (float)$r['total'];
            $labels[$r['month_num']] = $r['month_label'];
        }

        // Fill all 12 month labels
        $allLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        for ($i = 1; $i <= 12; $i++) {
            $labels[$i] = $labels[$i] ?? $allLabels[$i-1];
        }
        ksort($labels);

        $totalIncome  = array_sum(array_column($months, 'income'));
        $totalExpense = array_sum(array_column($months, 'expense'));
        $savings      = $totalIncome - $totalExpense;
        $savingsRate  = $totalIncome > 0 ? round(($savings / $totalIncome) * 100, 2) : 0;

        return [
            'year'          => $year,
            'total_income'  => $totalIncome,
            'total_expense' => $totalExpense,
            'savings'       => $savings,
            'savings_rate'  => $savingsRate,
            'monthly'       => $months,
            'labels'        => array_values($labels),
        ];
    }

    public function getAvailableYears(): array {
        $db = Database::getConnection();
        return $db->query(
            "SELECT DISTINCT YEAR(transaction_date) AS y FROM `transaction` ORDER BY y DESC"
        )->fetchAll(PDO::FETCH_COLUMN);
    }
}
