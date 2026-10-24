import { useState, useCallback } from "react";

export const useBudgetToast = () => {
    const [toastMessage, setToastMessage] = useState({
        visible: false,
        level: null,
        categoryName: null,
        remaining: 0,
    });

    const showToast = useCallback((data) => {
        setToastMessage({
        visible: true,
        level: data.level,
        categoryName: data.categoryName,
        remaining: data.remaining,
        });
    }, []);

    const hideToast = useCallback(() => {
        setToastMessage((prev) => ({ ...prev, visible: false }));
}, []);

    return {
        toastMessage,
        showToast,
        hideToast,
    };
};
