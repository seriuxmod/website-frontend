import { useEffect, useState } from 'react';
import { FaBagShopping, FaCartShopping, FaMagnifyingGlass } from 'react-icons/fa6';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useStoreCart from '../hooks/useStoreCart';

export default function StoreSubNavbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const cart = useStoreCart();
    const params = new URLSearchParams(location.search);
    const [search, setSearch] = useState(params.get('q') ?? '');

    useEffect(() => {
        setSearch(new URLSearchParams(location.search).get('q') ?? '');
    }, [location.search]);

    const submitSearch = (event) => {
        event.preventDefault();
        const next = new URLSearchParams();
        if (search.trim()) next.set('q', search.trim());
        navigate(`/store${next.size ? `?${next}` : ''}`);
    };

    const openCart = () => {
        const next = new URLSearchParams(location.pathname === '/store' ? location.search : '');
        next.set('cart', 'open');
        navigate(`/store?${next}`);
    };

    return (
        <div className="store-subnav pointer-events-auto mx-auto mt-2 flex max-w-[1430px] items-center gap-2 px-3 py-2 sm:px-4">
            <Link className="store-subnav-link hidden sm:inline-flex" to="/store">
                Shop
            </Link>
            <Link className="store-subnav-link hidden lg:inline-flex" to="/store/account">
                <FaBagShopping /> Meine Käufe
            </Link>
            <form className="store-subnav-search ml-auto" onSubmit={submitSearch}>
                <FaMagnifyingGlass aria-hidden="true" />
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Produkte durchsuchen ..."
                    aria-label="Produkte durchsuchen"
                />
                <button type="submit">Suchen</button>
            </form>
            <button className="store-cart-button" type="button" onClick={openCart}>
                <FaCartShopping />
                <span className="hidden sm:inline">Warenkorb</span>
                <b>{cart.count}</b>
            </button>
        </div>
    );
}
