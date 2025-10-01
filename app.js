// scripts/app.js
import { musicFiles } from './music-list.js';
import * as player from './player.js';
import * as playlist from './playlist.js';
import * as storage from './storage.js';
import * as ui from './ui.js';
import * as visualizer from './visualizer.js';

// --- Estado da Aplicação ---
const state = {
    playlist: [],
    currentIndex: -1,
    isShuffled: false,
};

// --- Funções de Callback (Conectam os Módulos) ---

/** Chamado pelo módulo 'playlist' quando uma faixa é clicada. */
function onTrackSelect(index) {
    state.currentIndex = index;
    player.loadTrack(state.playlist[state.currentIndex]);
    ui.update(state);
}

/** Chamado pelo módulo 'player' quando a música atual termina. */
function onTrackEnd() {
    const nextIndex = playlist.getNextTrackIndex(state.currentIndex, player.getLoopMode());
    if (nextIndex !== -1) {
        state.currentIndex = nextIndex;
        player.loadTrack(state.playlist[state.currentIndex]);
    } else {
        player.stop();
    }
    ui.update(state);
}

/** Chamado pelo módulo 'player' durante a reprodução da música. */
function onTimeUpdate(currentTime, duration) {
    ui.updateProgress(currentTime, duration);
}

// --- Funções de Controle ---

function playNext() {
    const nextIndex = playlist.getNextTrackIndex(state.currentIndex, 'all'); // Força pular
    if (nextIndex !== -1) {
        state.currentIndex = nextIndex;
        onTrackSelect(state.currentIndex);
    }
}

function playPrev() {
    state.currentIndex = (state.currentIndex - 1 + state.playlist.length) % state.playlist.length;
    onTrackSelect(state.currentIndex);
}

function toggleShuffle() {
    state.isShuffled = !state.isShuffled;
    state.playlist = playlist.shuffle(state.isShuffled);
    // Encontra a nova posição da música atual na playlist embaralhada
    const currentTrackId = player.getCurrentTrack()?.id;
    if (currentTrackId) {
        state.currentIndex = state.playlist.findIndex(track => track.id === currentTrackId);
    }
    ui.update(state);
    ui.showToast(`Embaralhar: ${state.isShuffled ? 'Ativado' : 'Desativado'}`);
}

// --- Inicialização ---

async function initialize() {
    // 1. Inicializa a UI (DOM selectors, tema, etc.)
    ui.init({
        onPlayPause: player.togglePlayPause,
        onNext: playNext,
        onPrev: playPrev,
        onShuffle: toggleShuffle,
        onLoop: player.toggleLoop,
        onSeek: player.seek,
        onVolumeChange: player.setVolume,
        onMute: player.toggleMute,
        onSearch: (term) => playlist.filter(term)
    });

    // 2. Carrega as preferências do usuário (volume, tema, etc.)
    const savedVolume = storage.loadPreference('volume', 1);
    const savedShuffle = storage.loadPreference('shuffle', false);
    const savedLoop = storage.loadPreference('loop', 'none');

    // 3. Inicializa o player de áudio com callbacks
    player.init({
        audioElement: ui.dom.audioPlayer,
        onTrackEnd,
        onTimeUpdate,
        onStateChange: ui.update,
        initialVolume: savedVolume,
        initialLoop: savedLoop,
    });

    // 4. Inicializa o visualizador
    visualizer.init(ui.dom.audioPlayer, ui.dom.visualizerCanvas);
    player.setVisualizer(visualizer);

    // 5. Inicializa a playlist
    const loadedPlaylist = await playlist.createPlaylistFromFiles(musicFiles);
    state.playlist = loadedPlaylist;
    state.isShuffled = savedShuffle;
    if (state.isShuffled) {
        state.playlist = playlist.shuffle(true);
    }
    
    playlist.init({
        playlistElement: ui.dom.playlistEl,
        trackList: state.playlist,
        onTrackSelect,
    });
    
    // 6. Atualiza a UI com o estado inicial
    ui.update(state);
}

document.addEventListener('DOMContentLoaded', initialize);
