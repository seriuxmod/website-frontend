import React, { useState, useEffect } from 'react';

export default function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        if (window.scrollY > 80) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    function handleClick(e) {
        const button = e.currentTarget;

        // Add the scale-90 class to make the button smaller
        button.classList.add('scale-90');

        // Remove the scale-90 class after the animation duration
        setTimeout(() => {
            button.classList.remove('scale-90');
        }, 200);

        // Trigger the scrollToTop function
        scrollToTop();
    }

    function scrollToTop() {
        // Your existing scroll to top logic here
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <div
            className={`fixed bottom-[var(--scroll-button-position)] right-[var(--scroll-button-position)] ${
                isVisible ? 'opacity-100' : 'opacity-0'
            } z-50 transition-opacity duration-[var(--scroll-button-transition)]`}
        >
            <button
                type="button"
                onClick={handleClick}
                className="flex h-[var(--scroll-button-size)] w-[var(--scroll-button-size)] items-center justify-center rounded-[var(--scroll-button-border-radius)] bg-[var(--scroll-button-bg)] text-[var(--scroll-button-text)] hover:bg-[var(--scroll-button-bg-hover)] hover:shadow-[0_4px_8px_var(--scroll-button-shadow-color)] focus:ring focus:ring-[var(--scroll-button-ring-color)]"
                aria-label="Scroll to Top"
            >
                &#8679; {/* Unicode for an upward arrow */}
            </button>
        </div>
    );
}
