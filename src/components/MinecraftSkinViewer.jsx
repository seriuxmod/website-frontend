import { useEffect, useMemo, useRef, useState } from 'react';
import { FaLayerGroup, FaPause, FaPerson, FaPersonWalking, FaPlaneUp, FaPlay, FaShirt } from 'react-icons/fa6';
import { playerDirectoryApi } from '../lib/playerDirectoryApi';

const ANIMATION_CONTROLS = [
    { key: 'idle', label: 'Ruhig', Icon: FaPerson },
    { key: 'walk', label: 'Laufen', Icon: FaPersonWalking },
    { key: 'crouch', label: 'Schleichen', Icon: FaPerson },
    { key: 'fly', label: 'Fliegen', Icon: FaPlaneUp }
];

function fallbackVariant(value = '') {
    return [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 2 === 0 ? 'default' : 'slim';
}

function createFallbackSkin(username, model) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    const alex = model === 'slim' || fallbackVariant(username) === 'slim';
    const hair = alex ? '#8f4f31' : '#3b251b';
    const skin = alex ? '#d99b73' : '#b87957';
    const shirt = alex ? '#5bb69c' : '#2889a8';
    const trousers = alex ? '#4a4b55' : '#3549a3';

    context.clearRect(0, 0, 64, 64);
    context.fillStyle = skin;
    context.fillRect(0, 0, 32, 16);
    context.fillRect(40, 16, 16, 16);
    context.fillStyle = hair;
    context.fillRect(0, 0, 32, 8);
    context.fillRect(8, 8, 8, 3);
    context.fillStyle = '#2b211e';
    context.fillRect(9, 11, 2, 1);
    context.fillRect(13, 11, 2, 1);
    context.fillStyle = shirt;
    context.fillRect(16, 16, 24, 16);
    context.fillRect(32, 48, 16, 16);
    context.fillStyle = trousers;
    context.fillRect(0, 16, 16, 16);
    context.fillRect(16, 48, 16, 16);
    return canvas;
}

function makeAnimation(runtime, name) {
    const Animation = {
        walk: runtime.WalkingAnimation,
        crouch: runtime.CrouchAnimation,
        fly: runtime.FlyingAnimation,
        idle: runtime.IdleAnimation
    }[name];
    const animation = new Animation();
    animation.speed = name === 'idle' ? 0.55 : name === 'fly' ? 0.42 : 0.8;
    return animation;
}

export default function MinecraftSkinViewer({ identifier, username, player = null }) {
    const canvasRef = useRef(null);
    const viewerRef = useRef(null);
    const runtimeRef = useRef(null);
    const animationRef = useRef('idle');
    const pausedRef = useRef(false);
    const outerLayerRef = useRef(true);
    const capeRef = useRef(true);
    const [directoryState, setDirectoryState] = useState({ loading: true, player: null, error: '' });
    const [viewerStatus, setViewerStatus] = useState('loading');
    const [animation, setAnimation] = useState('idle');
    const [paused, setPaused] = useState(false);
    const [outerLayer, setOuterLayer] = useState(true);
    const [capeVisible, setCapeVisible] = useState(true);

    useEffect(() => {
        if (player?.rendering) {
            setDirectoryState({ loading: false, player, error: '' });
            return undefined;
        }
        const controller = new AbortController();
        setDirectoryState({ loading: true, player: null, error: '' });
        playerDirectoryApi
            .byIdentifier(identifier || username, controller.signal)
            .then((player) => setDirectoryState({ loading: false, player, error: '' }))
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    setDirectoryState({ loading: false, player: null, error: error.message });
                }
            });
        return () => controller.abort();
    }, [identifier, player, username]);

    const rendering = directoryState.player?.rendering;
    const availableAnimations = useMemo(
        () => new Set(rendering?.animations?.length ? rendering.animations : ['idle']),
        [rendering?.animations]
    );

    useEffect(() => {
        if (directoryState.loading || !canvasRef.current) return undefined;
        let active = true;
        let viewer = null;
        let resizeObserver = null;

        const initialize = async () => {
            setViewerStatus('loading');
            try {
                const runtime = await import('skinview3d');
                if (!active || !canvasRef.current) return;

                const bounds = canvasRef.current.getBoundingClientRect();
                viewer = new runtime.SkinViewer({
                    canvas: canvasRef.current,
                    width: Math.max(1, Math.round(bounds.width)),
                    height: Math.max(1, Math.round(bounds.height)),
                    enableControls: true,
                    pixelRatio: 'match-device'
                });
                viewerRef.current = viewer;
                runtimeRef.current = runtime;
                viewer.fov = 34;
                viewer.zoom = 0.78;
                viewer.cameraLight.intensity = 1.15;
                viewer.globalLight.intensity = 0.72;
                viewer.autoRotate = false;
                viewer.playerWrapper.rotation.y = 0.18;
                viewer.controls.enablePan = false;
                viewer.controls.enableDamping = true;
                viewer.controls.minDistance = 18;
                viewer.controls.maxDistance = 95;

                let fallback = false;
                const model = rendering?.model || fallbackVariant(username);
                try {
                    if (!rendering?.skinTextureUrl) throw new Error('No remote texture');
                    await viewer.loadSkin(rendering.skinTextureUrl, { model });
                } catch {
                    fallback = true;
                    await viewer.loadSkin(createFallbackSkin(username, model), { model });
                }
                if (!active) return;

                if (rendering?.capeTextureUrl) {
                    try {
                        await viewer.loadCape(rendering.capeTextureUrl, { backEquipment: 'cape' });
                    } catch {
                        viewer.loadCape(null);
                    }
                }

                viewer.playerObject.skin.setOuterLayerVisible(
                    Boolean(rendering?.hasOuterLayer && outerLayerRef.current)
                );
                viewer.playerObject.backEquipment = rendering?.capeTextureUrl && capeRef.current ? 'cape' : null;
                const nextAnimation = availableAnimations.has(animationRef.current) ? animationRef.current : 'idle';
                animationRef.current = nextAnimation;
                viewer.animation = makeAnimation(runtime, nextAnimation);
                viewer.animation.paused = pausedRef.current;

                resizeObserver = new ResizeObserver(([entry]) => {
                    if (!viewer || viewer.disposed) return;
                    const { width, height } = entry.contentRect;
                    viewer.setSize(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
                });
                resizeObserver.observe(canvasRef.current);
                setViewerStatus(fallback ? 'fallback' : 'ready');
            } catch {
                if (active) setViewerStatus('error');
            }
        };

        initialize();
        return () => {
            active = false;
            resizeObserver?.disconnect();
            if (viewer) {
                viewer.animation = null;
                viewer.dispose();
            }
            if (viewerRef.current === viewer) viewerRef.current = null;
            runtimeRef.current = null;
        };
    }, [directoryState.loading, rendering, username, availableAnimations]);

    const selectAnimation = (name) => {
        const viewer = viewerRef.current;
        const runtime = runtimeRef.current;
        if (!viewer || !runtime || !availableAnimations.has(name)) return;
        animationRef.current = name;
        setAnimation(name);
        viewer.animation = makeAnimation(runtime, name);
        viewer.animation.paused = pausedRef.current;
    };

    const togglePaused = () => {
        const next = !pausedRef.current;
        pausedRef.current = next;
        setPaused(next);
        if (viewerRef.current?.animation) viewerRef.current.animation.paused = next;
    };

    const toggleOuterLayer = () => {
        const next = !outerLayerRef.current;
        outerLayerRef.current = next;
        setOuterLayer(next);
        viewerRef.current?.playerObject.skin.setOuterLayerVisible(Boolean(rendering?.hasOuterLayer && next));
    };

    const toggleCape = () => {
        const next = !capeRef.current;
        capeRef.current = next;
        setCapeVisible(next);
        if (viewerRef.current) viewerRef.current.playerObject.backEquipment = next ? 'cape' : null;
    };

    const loading = directoryState.loading || viewerStatus === 'loading';
    const hasCape = Boolean(rendering?.capeTextureUrl);
    const displayModel = rendering?.model || fallbackVariant(username);

    return (
        <div className="relative h-[440px] w-full select-none overflow-hidden rounded-[32px]">
            <div className="pointer-events-none absolute inset-x-[22%] bottom-12 h-16 rounded-[50%] bg-black/60 blur-xl" />
            <div className="pointer-events-none absolute inset-x-[24%] top-[18%] h-40 rounded-full bg-orange-500/[.07] blur-3xl" />
            <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
                aria-label={`Interaktives 3D-Modell des Minecraft-Skins von ${username}`}
            />

            <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/[.08] bg-black/35 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.14em] text-zinc-400 backdrop-blur-md">
                    3D · {displayModel === 'slim' ? 'Slim' : 'Wide'}
                </span>
                {viewerStatus === 'fallback' && (
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.14em] text-amber-300 backdrop-blur-md">
                        Fallback
                    </span>
                )}
            </div>

            {loading && (
                <div className="absolute inset-0 grid place-items-center bg-black/10">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-orange-500" />
                </div>
            )}
            {viewerStatus === 'error' && (
                <div className="absolute inset-0 grid place-items-center px-10 text-center text-sm leading-6 text-zinc-500">
                    Die 3D-Vorschau ist in diesem Browser nicht verfügbar.
                </div>
            )}

            {!loading && viewerStatus !== 'error' && (
                <div className="absolute inset-x-3 bottom-2 z-10 flex items-center justify-center gap-1.5 rounded-2xl border border-white/[.08] bg-[#0a0b0e]/75 p-1.5 shadow-2xl backdrop-blur-xl">
                    {ANIMATION_CONTROLS.filter(({ key }) => availableAnimations.has(key)).map(
                        ({ key, label, Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => selectAnimation(key)}
                                className={`grid h-9 w-9 place-items-center rounded-xl text-xs transition ${
                                    animation === key
                                        ? 'bg-orange-500 text-white shadow-[0_8px_24px_rgba(249,115,22,.28)]'
                                        : 'text-zinc-500 hover:bg-white/[.07] hover:text-white'
                                }`}
                                title={label}
                                aria-label={`Animation: ${label}`}
                                aria-pressed={animation === key}
                            >
                                <Icon />
                            </button>
                        )
                    )}
                    <span className="mx-1 h-5 w-px bg-white/[.08]" />
                    <button
                        type="button"
                        onClick={togglePaused}
                        className="grid h-9 w-9 place-items-center rounded-xl text-xs text-zinc-500 transition hover:bg-white/[.07] hover:text-white"
                        title={paused ? 'Animation fortsetzen' : 'Animation pausieren'}
                        aria-label={paused ? 'Animation fortsetzen' : 'Animation pausieren'}
                    >
                        {paused ? <FaPlay /> : <FaPause />}
                    </button>
                    {rendering?.hasOuterLayer && (
                        <button
                            type="button"
                            onClick={toggleOuterLayer}
                            className={`grid h-9 w-9 place-items-center rounded-xl text-xs transition ${
                                outerLayer ? 'text-orange-400' : 'text-zinc-600'
                            } hover:bg-white/[.07] hover:text-white`}
                            title="Skin-Außenlayer"
                            aria-label="Skin-Außenlayer ein- oder ausblenden"
                            aria-pressed={outerLayer}
                        >
                            <FaLayerGroup />
                        </button>
                    )}
                    {hasCape && (
                        <button
                            type="button"
                            onClick={toggleCape}
                            className={`grid h-9 w-9 place-items-center rounded-xl text-xs transition ${
                                capeVisible ? 'text-orange-400' : 'text-zinc-600'
                            } hover:bg-white/[.07] hover:text-white`}
                            title="Cape"
                            aria-label="Cape ein- oder ausblenden"
                            aria-pressed={capeVisible}
                        >
                            <FaShirt />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
