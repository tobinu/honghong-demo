"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

import type {
    Character,
    Scenario,
    GameState,
    ChatMessage,
    Emotion,
    PortraitState,
    AtmosphereLevel,
    GameRecord,
} from "@/lib/types";

import {
    CHARACTERS,
    SCENARIOS,
    ATMOSPHERE_BACKGROUNDS,
    getRandomScenario,
    getCharacterById,
    emotionToPortrait,
    forgivenessToAtmosphere,
    portraitFilter,
    SUCCESS_THRESHOLD,
    FAILURE_THRESHOLD,
    MAX_ROUNDS,
    INPUT_MIN_LENGTH,
    INPUT_MAX_LENGTH,
    RESULT_TEXTS,
} from "@/lib/game-data";

import { saveGameRecord, generateId, getGameStats } from "@/lib/storage";

function SakuraParticles() {
    const particles = useMemo(() => Array.from({
        length: 15
    }).map((_, i) => ({
        id: i,
        left: `${(i * 67 + 23) % 100}%`,
        delay: `${(i * 37 + 13) % 10}s`,
        duration: `${8 + (i * 53 + 7) % 8}s`,
        size: `${12 + (i * 41 + 3) % 16}px`
    })), []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map(p => <div
                key={p.id}
                className="absolute text-pink-300 opacity-40 animate-fall"
                style={{
                    left: p.left,
                    animationDelay: p.delay,
                    animationDuration: p.duration,
                    fontSize: p.size
                }}>🌸
                        </div>)}
        </div>
    );
}

const initialState: GameState = {
    phase: "home",
    characterId: null,
    scenarioId: null,
    messages: [],
    forgiveness: 20,
    currentRound: 0,
    maxRounds: MAX_ROUNDS,
    currentEmotion: "angry",
    currentPortrait: "angry",
    currentAtmosphere: "dark",
    isTyping: false,
    result: null
};

export default function HomePage() {
    const [state, setState] = useState<GameState>(initialState);
    const [inputValue, setInputValue] = useState("");
    const [displayedText, setDisplayedText] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [audioCache, setAudioCache] = useState<Record<number, string>>({});
    const [playingAudio, setPlayingAudio] = useState<number | null>(null);

    const [stats, setStats] = useState<{
        totalGames: number;
        winRate: string;
    } | null>(null);

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    const [review, setReview] = useState<{
        summary: string;
        goodPoints: string[];
        badPoints: string[];
        tip: string;
    } | null>(null);

    const [isLoadingReview, setIsLoadingReview] = useState(false);

    const [user, setUser] = useState<{ userId: number; username: string } | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const streamBufferRef = useRef("");
    const character = state.characterId ? getCharacterById(state.characterId) : null;
    const scenario = state.scenarioId ? SCENARIOS.find(s => s.id === state.scenarioId) : null;

    useEffect(() => {
        setStats(getGameStats());
    }, [state.phase]);

    // Read user from localStorage first (instant), then validate with API
    useEffect(() => {
        // 1. Read from localStorage for instant display
        let localUser: { userId: number; username: string } | null = null;
        try {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                localUser = JSON.parse(savedUser);
                setUser(localUser);
            }
        } catch {}

        // 2. Validate with API (authoritative source)
        //    Send Bearer token if available so /api/auth/me can verify even without cookie
        //    Only update state when API confirms a user; if API returns null
        //    but we have localStorage data, keep it (cookie may not be sent due to cross-origin)
        const meHeaders: Record<string, string> = { 'Cache-Control': 'no-store' };
        const existingToken = localStorage.getItem('auth_token');
        if (existingToken) meHeaders['Authorization'] = `Bearer ${existingToken}`;
        fetch('/api/auth/me', { credentials: 'include', cache: 'no-store', headers: meHeaders })
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    // Also refresh auth_token for Bearer auth (used by game-records API etc.)
                    if (data.token) {
                        localStorage.setItem('auth_token', data.token);
                    }
                } else if (!localUser) {
                    // Only clear if there's no localStorage data either
                    setUser(null);
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('auth_token');
                }
                // If API returns null but localStorage has user, keep localStorage value
            })
            .catch(() => {});
    }, []);

    const handleLogout = useCallback(async () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('auth_token');
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [state.messages, displayedText]);

    const startGame = useCallback(async (charId: string) => {
        const char = getCharacterById(charId);

        if (!char)
            return;

        const scenario = getRandomScenario();

        setState({
            ...initialState,
            phase: "chat",
            characterId: charId,
            scenarioId: scenario.id,
            forgiveness: scenario.initialForgiveness,
            currentEmotion: "angry",
            currentPortrait: "angry",
            currentAtmosphere: forgivenessToAtmosphere(scenario.initialForgiveness)
        });

        try {
            const res = await fetch("/api/opening-line", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    personalityPrompt: char.personalityPrompt,
                    scenarioDescription: scenario.description
                })
            });

            const data = await res.json();

            if (data.openingLine) {
                setState(prev => ({
                    ...prev,

                    messages: [{
                        role: "assistant",
                        content: data.openingLine,
                        emotion: "angry"
                    }]
                }));

                preloadTTS(0, data.openingLine, scenario.initialForgiveness);
            }
        } catch (err) {
            console.error("Failed to generate opening line:", err);

            setState(prev => ({
                ...prev,

                messages: [{
                    role: "assistant",
                    content: "你给我过来！你知道你干了什么吗？！",
                    emotion: "angry"
                }]
            }));
        }
    }, []);

    const preloadTTS = useCallback(async (messageIndex: number, text: string, forgiveness: number) => {
        try {
            const speechRate = Math.round(-20 + forgiveness / 100 * 40);
            const loudnessRate = Math.round(-10 + forgiveness / 100 * 20);

            const res = await fetch("/api/tts", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    text,
                    speechRate,
                    loudnessRate
                })
            });

            const data = await res.json();

            if (data.audioUrl) {
                setAudioCache(prev => ({
                    ...prev,
                    [messageIndex]: data.audioUrl
                }));
            }
        } catch (err) {
            console.error("TTS preload failed:", err);
        }
    }, []);

    const fetchSuggestions = useCallback(async () => {
        if (!character || !scenario)
            return;

        setIsLoadingSuggestions(true);
        setSuggestions([]);

        try {
            const res = await fetch("/api/suggestions", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    personalityPrompt: character.personalityPrompt,
                    scenarioDescription: scenario.description,

                    messages: state.messages.map(m => ({
                        role: m.role,
                        content: m.content
                    })),

                    currentForgiveness: state.forgiveness,
                    currentRound: state.currentRound,
                    maxRounds: MAX_ROUNDS
                })
            });

            const data = await res.json();

            if (data.suggestions && Array.isArray(data.suggestions)) {
                setSuggestions(data.suggestions);
            }
        } catch (err) {
            console.error("Fetch suggestions failed:", err);
        } finally {
            setIsLoadingSuggestions(false);
        }
    }, [character, scenario, state.messages, state.forgiveness, state.currentRound]);

    const fetchReview = useCallback(async () => {
        if (!character || !scenario)
            return;

        setIsLoadingReview(true);

        try {
            const res = await fetch("/api/review", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    personalityPrompt: character.personalityPrompt,
                    scenarioDescription: scenario.description,

                    messages: state.messages.map(m => ({
                        role: m.role,
                        content: m.content
                    })),

                    finalForgiveness: state.forgiveness,
                    result: state.result
                })
            });

            const data = await res.json();

            if (data.review) {
                setReview(data.review);
            }
        } catch (err) {
            console.error("Fetch review failed:", err);
        } finally {
            setIsLoadingReview(false);
        }
    }, [character, scenario, state.messages, state.forgiveness, state.result]);

    useEffect(() => {
        if (state.phase === "chat" && state.currentRound === 0 && state.messages.length > 0) {
            fetchSuggestions();
        }
    }, [state.phase, state.currentRound, state.messages.length, fetchSuggestions]);

    useEffect(() => {
        if (state.phase === "result") {
            fetchReview();
        }
    }, [state.phase, fetchReview]);

    const playAudio = useCallback((messageIndex: number) => {
        const url = audioCache[messageIndex];

        if (!url)
            return;

        if (audioRef.current) {
            audioRef.current.pause();
        }

        audioRef.current = new Audio(url);
        setPlayingAudio(messageIndex);
        audioRef.current.onended = () => setPlayingAudio(null);
        audioRef.current.onerror = () => setPlayingAudio(null);
        audioRef.current.play().catch(() => setPlayingAudio(null));
    }, [audioCache]);

    const sendMessage = useCallback(async () => {
        const trimmed = inputValue.trim();

        if (!trimmed || trimmed.length < INPUT_MIN_LENGTH || trimmed.length > INPUT_MAX_LENGTH)
            return;

        if (isStreaming || state.isTyping)
            return;

        if (state.currentRound >= state.maxRounds)
            return;

        const userMessage: ChatMessage = {
            role: "user",
            content: trimmed
        };

        setInputValue("");
        setIsStreaming(true);
        streamBufferRef.current = "";

        setState(prev => ({
            ...prev,
            messages: [...prev.messages, userMessage],
            currentRound: prev.currentRound + 1,
            isTyping: true
        }));

        try {
            const res = await fetch("/api/chat", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    characterId: state.characterId,
                    scenarioDescription: scenario?.description,
                    personalityPrompt: character?.personalityPrompt,

                    messages: state.messages.map(m => ({
                        role: m.role,
                        content: m.content
                    })),

                    userMessage: trimmed,
                    currentForgiveness: state.forgiveness,
                    currentRound: state.currentRound + 1,
                    maxRounds: MAX_ROUNDS
                })
            });

            if (!res.ok)
                throw new Error("Chat request failed");

            const reader = res.body?.getReader();

            if (!reader)
                throw new Error("No reader");

            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const {
                    done,
                    value
                } = await reader.read();

                if (done)
                    break;

                const chunk = decoder.decode(value, {
                    stream: true
                });

                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (!line.startsWith("data: "))
                        continue;

                    try {
                        const data = JSON.parse(line.substring(6));

                        if (data.type === "text") {
                            fullText += data.content;
                            streamBufferRef.current = fullText;
                            setDisplayedText(fullText);
                        } else if (data.type === "emotion") {
                            const emotion = data.emotion as Emotion;
                            const delta = data.delta as number;
                            const portrait = emotionToPortrait(emotion);

                            setState(prev => {
                                const newForgiveness = Math.max(-50, Math.min(100, prev.forgiveness + delta));
                                const atmosphere = forgivenessToAtmosphere(newForgiveness);
                                const isLastRound = prev.currentRound >= prev.maxRounds;
                                const isSuccessful = newForgiveness >= SUCCESS_THRESHOLD;
                                const isFailed = newForgiveness <= FAILURE_THRESHOLD;
                                const shouldEnd = isLastRound || isSuccessful || isFailed;

                                return {
                                    ...prev,
                                    forgiveness: newForgiveness,
                                    currentEmotion: emotion,
                                    currentPortrait: portrait,
                                    currentAtmosphere: atmosphere,
                                    isTyping: false,

                                    messages: [...prev.messages, {
                                        role: "assistant",
                                        content: data.cleanText,
                                        emotion
                                    }],

                                    result: shouldEnd ? isSuccessful ? "success" : "failure" : null,
                                    phase: shouldEnd ? "result" : "chat"
                                };
                            });

                            const newMsgIndex = state.messages.length + 1;

                            preloadTTS(
                                newMsgIndex,
                                data.cleanText,
                                Math.max(-50, Math.min(100, state.forgiveness + delta))
                            );

                            if (Math.abs(delta) >= 8) {
                                playKeySound();
                            }

                            if (state.currentRound < state.maxRounds) {
                                fetchSuggestions();
                            }
                        } else if (data.type === "done") {
                            setIsStreaming(false);
                            setDisplayedText("");
                        } else if (data.type === "error") {
                            console.error("Stream error:", data.message);
                            setIsStreaming(false);
                            setDisplayedText("");

                            setState(prev => ({
                                ...prev,
                                isTyping: false
                            }));
                        }
                    } catch {}
                }
            }
        } catch (err) {
            console.error("Send message error:", err);
            setIsStreaming(false);
            setDisplayedText("");

            setState(prev => ({
                ...prev,
                isTyping: false
            }));
        }
    }, [inputValue, state, character, scenario, isStreaming, preloadTTS]);

    const playKeySound = useCallback(() => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioCtx();

            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 440;
            oscillator.type = "sine";
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch {}
    }, []);

    const resetGame = useCallback(() => {
        setState(initialState);
        setInputValue("");
        setDisplayedText("");
        setIsStreaming(false);
        setAudioCache({});
        setPlayingAudio(null);
        setSuggestions([]);
        setReview(null);
    }, []);

    useEffect(() => {
        if (state.phase === "result" && state.result && character && scenario) {
            const record: GameRecord = {
                id: generateId(),
                characterId: state.characterId!,
                characterName: character.name,
                scenarioTitle: scenario.title,
                result: state.result,
                finalForgiveness: state.forgiveness,
                rounds: state.currentRound,
                timestamp: Date.now()
            };

            saveGameRecord(record);
        }
    }, [
        state.phase,
        state.result,
        character,
        scenario,
        state.characterId,
        state.forgiveness,
        state.currentRound
    ]);

    if (state.phase === "home") {
        return <HomePageView onSelectCharacter={startGame} stats={stats} user={user} onLogout={handleLogout} />;
    }

    if (state.phase === "chat") {
        return (
            <ChatView
                state={state}
                character={character!}
                scenario={scenario!}
                inputValue={inputValue}
                setInputValue={setInputValue}
                sendMessage={sendMessage}
                isStreaming={isStreaming}
                displayedText={displayedText}
                audioCache={audioCache}
                playingAudio={playingAudio}
                onPlayAudio={playAudio}
                chatEndRef={chatEndRef}
                inputRef={inputRef}
                suggestions={suggestions}
                isLoadingSuggestions={isLoadingSuggestions}
                onSelectSuggestion={(text: string) => {
                    setInputValue(text);
                    inputRef.current?.focus();
                }}
                forgiveness={state.forgiveness} />
        );
    }

    return (
        <ResultView
            state={state}
            character={character!}
            scenario={scenario!}
            onReset={resetGame}
            review={review}
            isLoadingReview={isLoadingReview}
            user={user} />
    );
}

function HomePageView(
    {
        onSelectCharacter,
        stats,
        user,
        onLogout
    }: {
        onSelectCharacter: (id: string) => void;
        stats: {
            totalGames: number;
            winRate: string;
        } | null;
        user: { userId: number; username: string } | null;
        onLogout: () => void;
    }
) {
    return (
        <div
            className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-pink-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* 樱花粒子 */}
            <SakuraParticles />
            {/* 顶部导航栏 */}
            <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-white/40 backdrop-blur-md border-b border-pink-100/50">
                <Link href="/" className="text-lg font-bold text-gray-900">
                    哄哄模拟器
                </Link>
                {user ? (
                    <div className="flex items-center gap-3">
                        <Link href="/profile" className="text-sm text-gray-600 flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                            <span className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 text-xs font-bold">
                                {user.username.charAt(0).toUpperCase()}
                            </span>
                            <span className="text-pink-500 font-medium">{user.username}</span>
                        </Link>
                        <button
                            onClick={onLogout}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2.5 py-1 rounded-lg hover:bg-white/60 border border-gray-200"
                        >
                            退出登录
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Link
                            href="/login"
                            className="text-sm text-pink-500 hover:text-pink-600 font-medium px-3 py-1.5 rounded-lg bg-white/60 hover:bg-white/80 transition-all border border-pink-200"
                        >
                            登录
                        </Link>
                        <Link
                            href="/register"
                            className="text-sm text-white hover:text-pink-50 font-medium px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 transition-all"
                        >
                            注册
                        </Link>
                    </div>
                )}
            </nav>
            {}
            <div className="text-center mb-8 z-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">哄哄模拟器</h1>
                <p
                    className="text-pink-400 text-lg"
                    style={{
                        fontFamily: "DOUYINSANSBOLD-GB",
                        fontWeight: "bold"
                    }}>代入感增强版</p>
                <p className="text-gray-500 text-sm mt-2">选择你想要哄的角色，开始挑战吧</p>
                {stats && stats.totalGames > 0 && <p className="text-gray-400 text-xs mt-1">已玩 {stats.totalGames}局 · 胜率 {stats.winRate}
                </p>}
            </div>
            {}
            <div className="flex flex-col gap-4 w-full max-w-sm z-10">
                {CHARACTERS.map(char => <button
                    key={char.id}
                    onClick={() => onSelectCharacter(char.id)}
                    className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-pink-100">
                    {}
                    <div
                        className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-pink-200 group-hover:ring-pink-400 transition-all">
                        <img
                            src={char.portraits.neutral}
                            alt={char.name}
                            className="w-full h-full object-cover object-top" />
                    </div>
                    {}
                    <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800">{char.name}</span>
                            <span className="text-xs text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full">
                                {char.title}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{char.description}</p>
                    </div>
                    {}
                    <div
                        className="text-pink-300 group-hover:text-pink-500 transition-colors flex-shrink-0">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd" />
                        </svg>
                    </div>
                </button>)}
            </div>
            {}
            <div className="flex gap-3 z-10">
              <Link
                href="/blog"
                className="px-5 py-2.5 rounded-full border-2 border-pink-300 text-pink-500 text-sm font-medium hover:bg-pink-50 transition-colors"
              >
                恋爱攻略
              </Link>
              <Link
                href="/leaderboard"
                className="px-5 py-2.5 rounded-full border-2 border-purple-300 text-purple-500 text-sm font-medium hover:bg-purple-50 transition-colors"
              >
                排行榜
              </Link>
            </div>
            <p className="text-gray-400 text-xs mt-4 z-10">10 轮对话内把原谅值哄到 60 以上就算成功</p>
        </div>
    );
}

function ChatView(
    {
        state,
        character,
        scenario,
        inputValue,
        setInputValue,
        sendMessage,
        isStreaming,
        displayedText,
        audioCache,
        playingAudio,
        onPlayAudio,
        chatEndRef,
        inputRef,
        suggestions,
        isLoadingSuggestions,
        onSelectSuggestion,
        forgiveness
    }: {
        state: GameState;
        character: Character;
        scenario: Scenario;
        inputValue: string;
        setInputValue: (v: string) => void;
        sendMessage: () => void;
        isStreaming: boolean;
        displayedText: string;
        audioCache: Record<number, string>;
        playingAudio: number | null;
        onPlayAudio: (idx: number) => void;
        chatEndRef: React.RefObject<HTMLDivElement | null>;
        inputRef: React.RefObject<HTMLInputElement | null>;
        suggestions: string[];
        isLoadingSuggestions: boolean;
        onSelectSuggestion: (text: string) => void;
        forgiveness: number;
    }
) {
    const atmosphereBg = ATMOSPHERE_BACKGROUNDS[state.currentAtmosphere];
    const currentPortraitUrl = character.portraits[state.currentPortrait];
    const filterStyle = portraitFilter(state.currentPortrait);

    return (
        <div className="h-screen flex flex-col bg-[#EDEDED] relative overflow-hidden">
            {}
            <div className="flex-shrink-0 bg-[#EDEDED] border-b border-[#D9D9D9]">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                            <img
                                src={character.portraits.neutral}
                                alt={character.name}
                                className="w-full h-full object-cover object-top" />
                        </div>
                        <div>
                            <div className="text-[#191919] text-base font-medium leading-tight">{character.name}</div>
                            <div className="text-[#999] text-xs mt-0.5">
                                {state.currentRound}/{state.maxRounds}轮 · {scenario.title}
                            </div>
                        </div>
                    </div>
                    {}
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm">
                            {forgiveness >= 80 ? "❤️" : forgiveness >= 60 ? "💕" : forgiveness >= 30 ? "💔" : forgiveness >= 0 ? "😾" : "💣"}
                        </span>
                        <div className="w-16 h-1.5 bg-[#D9D9D9] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${Math.max(0, Math.min(100, (forgiveness + 50) / 1.5))}%`,
                                    background: forgiveness >= 60 ? "#07C160" : forgiveness >= 30 ? "#FA9D3B" : forgiveness >= 0 ? "#888" : "#FA5151"
                                }} />
                        </div>
                    </div>
                </div>
            </div>
            {}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 bg-[#EDEDED]">
                {}
                <div className="text-center py-2">
                    <span
                        className="inline-block bg-[#CECECE] text-[#737373] text-xs px-3 py-1 rounded-sm">
                        {scenario.description}
                    </span>
                </div>
                {state.messages.map((msg, idx) => {
                    const isUser = msg.role === "user";

                    return (
                        <div
                            key={idx}
                            className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}>
                            {}
                            {!isUser && <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 mt-0.5">
                                <img
                                    src={character.portraits.neutral}
                                    alt={character.name}
                                    className="w-full h-full object-cover object-top" />
                            </div>}
                            {}
                            <div className={`relative max-w-[65%] group`}>
                                <div
                                    className={`px-3 py-2 text-[15px] leading-[1.5] ${isUser ? "bg-[#95EC69] text-[#191919] rounded-sm" : "bg-white text-[#191919] rounded-sm"}`}
                                    style={{
                                        wordBreak: "break-word"
                                    }}>
                                    {msg.content}
                                </div>
                                {}
                                {!isUser && audioCache[idx] && <button
                                    onClick={() => onPlayAudio(idx)}
                                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center hover:scale-110 transition-transform opacity-0 group-hover:opacity-100">
                                    {playingAudio === idx ? <span className="text-[#07C160] text-xs">⏸</span> : <span className="text-[#07C160] text-xs">🔊</span>}
                                </button>}
                            </div>
                            {}
                            {isUser && <div
                                className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 mt-0.5 bg-[#1475DE] flex items-center justify-center">
                                <span className="text-white text-lg">我</span>
                            </div>}
                        </div>
                    );
                })}
                {}
                {isStreaming && displayedText && <div className="flex justify-start gap-2">
                    <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 mt-0.5">
                        <img
                            src={character.portraits.neutral}
                            alt={character.name}
                            className="w-full h-full object-cover object-top" />
                    </div>
                    <div
                        className="max-w-[65%] px-3 py-2 bg-white text-[#191919] rounded-sm text-[15px] leading-[1.5]"
                        style={{
                            wordBreak: "break-word"
                        }}>
                        {displayedText}<span className="animate-pulse">▌</span>
                    </div>
                </div>}
                {}
                {state.isTyping && !isStreaming && <div className="flex justify-start gap-2">
                    <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 mt-0.5">
                        <img
                            src={character.portraits.neutral}
                            alt={character.name}
                            className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="px-3 py-2 bg-white rounded-sm text-[#999] text-[15px]">对方正在输入...
                                    </div>
                </div>}
                <div ref={chatEndRef} />
            </div>
            {}
            <div className="flex-shrink-0 bg-[#F7F7F7] border-t border-[#D9D9D9]">
                {}
                {suggestions.length > 0 && !isStreaming && !state.isTyping && <div className="px-3 pt-2 pb-1">
                    <div className="flex flex-wrap gap-1.5">
                        {suggestions.map((text, idx) => <button
                            key={`sug-${idx}`}
                            onClick={() => onSelectSuggestion(text)}
                            className="bg-white hover:bg-[#F0F0F0] text-[#191919] text-xs px-2.5 py-1.5 rounded-sm border border-[#E0E0E0] hover:border-[#07C160] transition-all active:scale-95">
                            {text}
                        </button>)}
                    </div>
                </div>}
                {isLoadingSuggestions && !isStreaming && !state.isTyping && <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4].map(i => <div
                        key={i}
                        className="bg-[#E8E8E8] text-transparent text-xs px-2.5 py-1.5 rounded-sm animate-pulse">加载中...
                                      </div>)}
                </div>}
                {}
                <div className="flex items-end gap-2 px-3 py-2">
                    <div className="flex-1 bg-white rounded-sm border border-[#D9D9D9]">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="说点什么来哄她..."
                            maxLength={INPUT_MAX_LENGTH}
                            disabled={isStreaming || state.isTyping}
                            className="w-full px-3 py-2 text-sm text-[#191919] placeholder-[#BDBDBD] outline-none bg-transparent disabled:opacity-50" />
                    </div>
                    <button
                        onClick={sendMessage}
                        disabled={isStreaming || state.isTyping || inputValue.trim().length < INPUT_MIN_LENGTH}
                        className="px-4 py-2 bg-[#07C160] text-white rounded-sm text-sm font-medium hover:bg-[#06AD56] disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95 flex-shrink-0">发送
                                  </button>
                </div>
                <div className="text-right px-3 pb-1">
                    <span className="text-[#BDBDBD] text-xs">
                        {inputValue.length}/{INPUT_MAX_LENGTH}
                    </span>
                </div>
            </div>
        </div>
    );
}

function ResultView(
    {
        state,
        character,
        scenario,
        onReset,
        review,
        isLoadingReview,
        user
    }: {
        state: GameState;
        character: Character;
        scenario: Scenario;
        onReset: () => void;
        review: {
            summary: string;
            goodPoints: string[];
            badPoints: string[];
            tip: string;
        } | null;
        isLoadingReview: boolean;
        user: { userId: number; username: string } | null;
    }
) {
    const isSuccess = state.result === "success";
    const portraitUrl = isSuccess ? character.portraits.happy : character.portraits.angry;
    const atmosphereBg = isSuccess ? ATMOSPHERE_BACKGROUNDS.warm : ATMOSPHERE_BACKGROUNDS.dark;
    const resultText = RESULT_TEXTS[state.result!][state.characterId as keyof (typeof RESULT_TEXTS.success)] ?? "";

    // 保存游戏记录
    const [saveToast, setSaveToast] = useState<string | null>(null);
    const hasSavedRef = useRef(false);
    useEffect(() => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        const saveRecord = async () => {
            if (user) {
                try {
                    const headers: Record<string, string> = { "Content-Type": "application/json" };
                    let token = localStorage.getItem("auth_token");
                    if (token) headers["Authorization"] = `Bearer ${token}`;

                    let res = await fetch("/api/game-records", {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                            scenario: scenario.title,
                            finalScore: state.forgiveness,
                            result: state.result
                        })
                    });

                    // If 401, try refreshing the token via /api/auth/me and retry once
                    if (res.status === 401) {
                        console.warn("[game-records] Got 401, attempting token refresh...");
                        const meHeaders: Record<string, string> = {};
                        if (token) meHeaders["Authorization"] = `Bearer ${token}`;
                        const meRes = await fetch("/api/auth/me", { credentials: "include", headers: meHeaders });
                        if (meRes.ok) {
                            const meData = await meRes.json();
                            if (meData.token) {
                                localStorage.setItem("auth_token", meData.token);
                                // Retry with refreshed token
                                const retryHeaders: Record<string, string> = { "Content-Type": "application/json" };
                                retryHeaders["Authorization"] = `Bearer ${meData.token}`;
                                res = await fetch("/api/game-records", {
                                    method: "POST",
                                    headers: retryHeaders,
                                    body: JSON.stringify({
                                        scenario: scenario.title,
                                        finalScore: state.forgiveness,
                                        result: state.result
                                    })
                                });
                            }
                        }
                    }

                    if (res.ok) {
                        setSaveToast("您的游戏记录已保存");
                    } else {
                        let errMsg = "游戏记录保存失败";
                        try { const errData = await res.json(); errMsg = `保存失败(${res.status}): ${errData.error || "未知错误"}`; } catch {}
                        console.error("[game-records] save failed:", res.status, errMsg);
                        setSaveToast(errMsg);
                    }
                } catch (err) {
                    console.error("[game-records] save error:", err);
                    setSaveToast("游戏记录保存失败(网络错误)");
                }
            } else {
                setSaveToast("登录后可保存你的游戏记录");
            }
            setTimeout(() => setSaveToast(null), 3000);
        };
        saveRecord();
    }, [user, scenario.title, state.forgiveness, state.result]);

    return (
        <div className="h-screen flex flex-col relative overflow-hidden">
            {}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `url(${atmosphereBg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                }} />
            <div
                className="absolute inset-0"
                style={{
                    background: isSuccess ? "linear-gradient(to bottom, rgba(255,220,150,0.3), rgba(255,200,100,0.5))" : "linear-gradient(to bottom, rgba(50,10,10,0.4), rgba(30,5,20,0.7))"
                }} />
            {}
            <div
                className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
                {}
                <div className="h-[40vh] flex items-end justify-center mb-4">
                    <img
                        src={portraitUrl}
                        alt={character.name}
                        className="h-full object-contain drop-shadow-2xl"
                        style={{
                            filter: isSuccess ? "brightness(1.1) saturate(1.2)" : "brightness(0.8) saturate(0.9)"
                        }} />
                </div>
                {}
                <div className="text-center mb-4">
                    <h2
                        className={`text-3xl font-bold mb-2 ${isSuccess ? "text-amber-100" : "text-red-200"}`}>
                        {isSuccess ? "哄好了！" : "没哄好..."}
                    </h2>
                    <p className="text-sm text-white/60">
                        {scenario.title}· 用了 {state.currentRound}轮
                                  </p>
                </div>
                {}
                <div
                    className="bg-white/85 backdrop-blur-sm rounded-2xl px-6 py-4 max-w-sm w-full mb-4 shadow-lg">
                    <p className="text-gray-800 text-sm leading-relaxed text-center italic">“{resultText}”
                                  </p>
                    <p className="text-center text-pink-400 text-xs mt-2">—— {character.name}</p>
                </div>
                {}
                {isLoadingReview && <div
                    className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-4 max-w-sm w-full mb-4 shadow-lg">
                    <div className="flex items-center gap-2 text-gray-500">
                        <div
                            className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">正在复盘对话...</span>
                    </div>
                </div>}
                {review && !isLoadingReview && <div
                    className="bg-white/85 backdrop-blur-sm rounded-2xl px-5 py-4 max-w-sm w-full mb-6 shadow-lg">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">对话复盘</h3>
                    <p className="text-gray-600 text-xs leading-relaxed mb-3">{review.summary}</p>
                    {review.goodPoints.length > 0 && <div className="mb-2">
                        <p className="text-xs font-medium text-green-600 mb-1">说得好的地方</p>
                        {review.goodPoints.map((point, idx) => <p
                            key={idx}
                            className="text-xs text-gray-600 pl-3 mb-0.5 before:content-['✓'] before:text-green-500 before:mr-1.5">
                            {point}
                        </p>)}
                    </div>}
                    {review.badPoints.length > 0 && <div className="mb-2">
                        <p className="text-xs font-medium text-orange-500 mb-1">可以说得更好的地方</p>
                        {review.badPoints.map((point, idx) => <p
                            key={idx}
                            className="text-xs text-gray-600 pl-3 mb-0.5 before:content-['✗'] before:text-orange-400 before:mr-1.5">
                            {point}
                        </p>)}
                    </div>}
                    {review.tip && <div className="bg-pink-50 rounded-xl px-3 py-2 mt-2">
                        <p className="text-xs text-pink-700">
                            <span className="font-medium">沟通小贴士：</span>{review.tip}
                        </p>
                    </div>}
                </div>}
                {}
                <div className="flex gap-3">
                    <button
                        onClick={onReset}
                        className="px-8 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors active:scale-95 shadow-lg">再来一局
                                  </button>
                </div>
            </div>
            {/* 游戏记录保存提示 */}
            {saveToast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-sm rounded-full px-5 py-2.5 shadow-lg border border-pink-100 animate-bounce">
                <p className="text-sm text-gray-700 font-medium">{saveToast}</p>
            </div>}
        </div>
    );
}