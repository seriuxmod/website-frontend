import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'seriux_store_cart_v1';
const EVENT_NAME = 'seriux-store-cart-change';

const readCart = () => {
    try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
};

const writeCart = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export default function useStoreCart() {
    const [items, setItems] = useState(readCart);

    useEffect(() => {
        const update = () => setItems(readCart());
        window.addEventListener(EVENT_NAME, update);
        window.addEventListener('storage', update);
        return () => {
            window.removeEventListener(EVENT_NAME, update);
            window.removeEventListener('storage', update);
        };
    }, []);

    return useMemo(
        () => ({
            items,
            count: items.reduce((sum, item) => sum + item.quantity, 0),
            add(product, fields = []) {
                const current = readCart();
                const index = current.findIndex((item) => item.productId === product.id);
                if (index >= 0)
                    current[index] = {
                        ...current[index],
                        quantity: Math.min(100, current[index].quantity + 1),
                        fields
                    };
                else current.push({ productId: product.id, quantity: 1, fields });
                writeCart(current);
            },
            setQuantity(productId, quantity) {
                const safeQuantity = Math.max(1, Math.min(100, Number(quantity) || 1));
                writeCart(
                    readCart().map((item) =>
                        item.productId === productId ? { ...item, quantity: safeQuantity } : item
                    )
                );
            },
            remove(productId) {
                writeCart(readCart().filter((item) => item.productId !== productId));
            },
            clear() {
                writeCart([]);
            }
        }),
        [items]
    );
}
