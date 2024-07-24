import Header from './Header';
import { useState } from 'react';

export default function Home() {
    useState(() => {
        document.title = 'SeriuxMod | Home';
    }, []);
    return (
        <div className="flex min-h-screen w-screen flex-col items-center justify-start">
            <Header />
        </div>
    );
}
