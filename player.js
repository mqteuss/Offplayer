// scripts/player.js
import * as storage from './storage.js';

let audioElement;
let currentTrack;
let playlist = [];
let isPlaying = false;
let loopMode = 'none'; // 'none', 'one', 'all'
let isSeeking = false;
let visualizer;

// Funções de callback para comunicar com app.js
let onTrackEnd, onTimeUpdate, onStateChange;

function init(config) {
    audioElement = config.audioElement;
    onTrackEnd = config.onTrackEnd;
    onTimeUpdate = config.onTimeUpdate;
    onStateChange = config.onStateChange;

    audioElement.volume = config.initialVolume;
    loopMode = config.initialLoop;

    audioElement.addEventListener('ended', handleTrackEnd);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
}

function setVisualizer(_visualizer) {
    visualizer = _visualizer;
}

function loadTrack(track) {
    currentTrack = track;
    audioElement.src = track.src;
    play();
}

function play() {
    isPlaying = true;
    audioElement.play();
    visualizer?.start();
    onStateChange({ isPlaying, currentTrack, loopMode });
}

function pause() {
    isPlaying = false;
    audioElement.pause();
    visualizer?.stop();
    onStateChange({ isPlaying, currentTrack, loopMode });
}

function stop() {
    isPlaying = false;
    audioElement.pause();
    audioElement.currentTime = 0;
    visualizer?.stop();
    onStateChange({ isPlaying, currentTrack: null, loopMode });
}

function togglePlayPause() {
    if (isPlaying) {
        pause();
    } else if (currentTrack) {
        play();
    }
}

function handleTrackEnd() {
    if (loopMode === 'one') {
        audioElement.currentTime = 0;
        play();
    } else {
        onTrackEnd();
    }
}

function handleTimeUpdate() {
    if (isSeeking) return;
    onTimeUpdate(audioElement.currentTime, audioElement.duration);
}

function handleLoadedMetadata() {
    onTimeUpdate(audioElement.currentTime, audioElement.duration);
}

function seek(percentage) {
    if (!isNaN(audioElement.duration)) {
        audioElement.currentTime = (percentage / 100) * audioElement.duration;
    }
}

function setVolume(value) {
    audioElement.volume = value;
    audioElement.muted = value === 0;
    storage.savePreference('volume', value);
    onStateChange({ isPlaying, currentTrack, volume: audioElement.volume, isMuted: audioElement.muted });
}

function toggleMute() {
    audioElement.muted = !audioElement.muted;
    storage.savePreference('volume', audioElement.muted ? 0 : audioElement.volume);
    onStateChange({ isPlaying, currentTrack, volume: audioElement.volume, isMuted: audioElement.muted });
}

function toggleLoop() {
    const modes = ['none', 'all', 'one'];
    const currentModeIndex = modes.indexOf(loopMode);
    loopMode = modes[(currentModeIndex + 1) % modes.length];
    storage.savePreference('loop', loopMode);
    onStateChange({ isPlaying, currentTrack, loopMode });
}

function getLoopMode() {
    return loopMode;
}

function getCurrentTrack() {
    return currentTrack;
}

export {
    init,
    loadTrack,
    togglePlayPause,
    stop,
    seek,
    setVolume,
    toggleMute,
    toggleLoop,
    getLoopMode,
    getCurrentTrack,
    setVisualizer
};
