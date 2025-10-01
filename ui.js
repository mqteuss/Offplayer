// scripts/ui.js
import * as storage from './storage.js';

// --- Seletores de DOM ---
const dom = {
    audioPlayer: document.getElementById('audio-player'),
    playPauseBtn: document.getElementById('play-pause-btn'),
    playIcon: document.getElementById('play-icon'),
    pauseIcon: document.getElementById('pause-icon'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    progressBar: document.getElementById('progress-bar'),
    currentTimeEl: document.getElementById('current-time'),
    totalDurationEl: document.getElementById('total-duration'),
    volumeSlider: document.getElementById('volume-slider'),
    muteBtn: document.getElementById('mute-btn'),
    volumeHighIcon: document.getElementById('volume-high-icon'),
    volumeMuteIcon: document.getElementById('volume-mute-icon'),
    loopBtn: document.getElementById('loop-btn'),
    loopAllIcon: document.getElementById('loop-all-icon'),
    loopOneIcon: document.getElementById('loop-one-icon'),
    shuffleBtn: document.getElementById('shuffle-btn'),
    playlistEl: document.getElementById('playlist'),
    trackTitleEl: document.getElementById('track-title'),
    trackArtistEl: document.getElementById('track-artist'),
    albumArtImg: document.getElementById('album-art-img'),
    albumArtPlaceholder: document.getElementById('album-art-placeholder'),
    visualizerCanvas: document.getElementById('visualizer'),
    toast: document.getElementById('toast'),
    themeToggle: document.getElementById('theme-toggle'),
    searchInput: document.getElementById('search-input'),
};

let eventHandlers = {};

function init(handlers) {
    eventHandlers = handlers;
    
    // Configura o tema inicial
    const savedTheme = storage.loadPreference('theme', 'dark');
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');

    addEventListeners();
}

function update(state) {
    const { isPlaying, currentTrack, loopMode, volume, isMuted, isShuffled, playlist, currentIndex } = state;
    
    // Botão Play/Pause
    dom.playIcon.style.display = isPlaying ? 'none' : 'block';
    dom.pauseIcon.style.display = isPlaying ? 'block' : 'none';

    // Informações da faixa
    if (currentTrack) {
        dom.trackTitleEl.textContent = currentTrack.title;
        dom.trackArtistEl.textContent = currentTrack.artist;
        document.title = `${currentTrack.title} - ${currentTrack.artist}`;
        if (currentTrack.picture) {
            dom.albumArtImg.src = currentTrack.picture;
            dom.albumArtImg.style.display = 'block';
            dom.albumArtPlaceholder.style.display = 'none';
        } else {
            dom.albumArtImg.style.display = 'none';
            dom.albumArtPlaceholder.style.display = 'flex';
        }
    } else {
        dom.trackTitleEl.textContent = 'Nenhuma música tocando';
        dom.trackArtistEl.textContent = 'Sua playlist está vazia';
        document.title = 'Player de Música Offline';
        dom.albumArtImg.style.display = 'none';
        dom.albumArtPlaceholder.style.display = 'flex';
    }

    // Botões de Loop e Shuffle
    dom.loopBtn.classList.toggle('active', loopMode !== 'none');
    dom.loopAllIcon.style.display = loopMode !== 'one' ? 'block' : 'none';
    dom.loopOneIcon.style.display = loopMode === 'one' ? 'block' : 'none';
    dom.shuffleBtn.classList.toggle('active', isShuffled);

    // Destaque na Playlist
    const items = dom.playlistEl.querySelectorAll('.playlist-item');
    items.forEach((item, index) => {
        item.classList.toggle('playing', index === currentIndex);
    });
    
    // Controles de Volume
    if (volume !== undefined) {
       dom.volumeSlider.value = isMuted ? 0 : volume;
       dom.volumeHighIcon.style.display = isMuted || volume === 0 ? 'none' : 'block';
       dom.volumeMuteIcon.style.display = isMuted || volume === 0 ? 'block' : 'none';
    }
}

function updateProgress(currentTime, duration) {
    if (isNaN(duration)) return;
    dom.progressBar.value = (currentTime / duration) * 100;
    dom.currentTimeEl.textContent = formatTime(currentTime);
    dom.totalDurationEl.textContent = formatTime(duration);
}

function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    setTimeout(() => dom.toast.classList.remove('show'), 3000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function addEventListeners() {
    dom.playPauseBtn.addEventListener('click', eventHandlers.onPlayPause);
    dom.nextBtn.addEventListener('click', eventHandlers.onNext);
    dom.prevBtn.addEventListener('click', eventHandlers.onPrev);
    dom.shuffleBtn.addEventListener('click', eventHandlers.onShuffle);
    dom.loopBtn.addEventListener('click', eventHandlers.onLoop);
    dom.progressBar.addEventListener('input', (e) => eventHandlers.onSeek(e.target.value));
    dom.volumeSlider.addEventListener('input', (e) => eventHandlers.onVolumeChange(parseFloat(e.target.value)));
    dom.muteBtn.addEventListener('click', eventHandlers.onMute);
    dom.searchInput.addEventListener('input', (e) => eventHandlers.onSearch(e.target.value));

    dom.themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        storage.savePreference('theme', isDark ? 'dark' : 'light');
    });

    // Atalhos de teclado
    window.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea')) return;
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                eventHandlers.onPlayPause();
                break;
            case 'ArrowRight':
                dom.audioPlayer.currentTime += 5;
                break;
            case 'ArrowLeft':
                dom.audioPlayer.currentTime -= 5;
                break;
        }
    });
}

export { init, update, updateProgress, showToast, dom };
