import { useEffect, useState } from 'react';
import { skinApi } from '../lib/skinApi.js';

/** Canonical texture pixels only. No guessed Classic/Slim model and no player/source projection. */
export default function SkinTexturePreview({ texture }) {
    const [state, setState] = useState({ url: null, error: '', loading: true });
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        const controller = new AbortController(); let active = true, url;
        setState({ url: null, error: '', loading: true });
        skinApi.media(texture, controller.signal).then(blob => {
            if (!active) return;
            url = URL.createObjectURL(blob); setState({ url, error: '', loading: false });
        }).catch(error => {
            if (active && error.name !== 'AbortError') setState({ url: null, error: error.message, loading: false });
        });
        return () => { active = false; controller.abort(); if (url) URL.revokeObjectURL(url); };
    }, [texture.textureId, texture.mediaSha256, retry]);
    return <div className="flex min-h-48 items-center justify-center rounded-2xl bg-black/20 p-4 text-center text-xs text-zinc-500">
        {state.loading ? <span role="status">Textur wird geprüft und geladen …</span>
            : state.error ? <div role="alert"><p>{state.error}</p><button className="mt-3 text-orange-300" onClick={() => setRetry(value => value + 1)}>Erneut versuchen</button></div>
                : <img src={state.url} width={texture.width * 2} height={texture.height * 2} alt={`Skintextur ${texture.width} × ${texture.height} Pixel`}
                    className="max-w-full" style={{ imageRendering: 'pixelated' }} />}
    </div>;
}
