// scripts/playlist.js
let playlistElement;
let onTrackSelectCallback;
let trackList = [];
let originalTrackList = [];

function init(config) {
    playlistElement = config.playlistElement;
    onTrackSelectCallback = config.onTrackSelect;
    trackList = config.trackList;
    originalTrackList = [...trackList]; // Salva a ordem original
    render();
    addDragAndDropEvents();
}

/** Lê os metadados de um arquivo de áudio. */
function readMetadata(file) {
    return new Promise((resolve) => {
        window.jsmediatags.read(file, {
            onSuccess: (tag) => {
                const { title, artist, album, picture } = tag.tags;
                let imageSrc = null;
                if (picture) {
                    const base64String = btoa(String.fromCharCode.apply(null, picture.data));
                    imageSrc = `data:${picture.format};base64,${base64String}`;
                }
                resolve({ title, artist, album, picture: imageSrc });
            },
            onError: () => resolve({}), // Resolve com objeto vazio em caso de erro
        });
    });
}

/** Cria a estrutura da playlist a partir da lista de nomes de arquivos. */
async function createPlaylistFromFiles(files) {
    const trackPromises = files.map(async (fileName, index) => {
        const filePath = `musics/${fileName}`;
        try {
            const response = await fetch(filePath);
            const blob = await response.blob();
            const metadata = await readMetadata(blob);

            return {
                id: `track-${index}-${Date.now()}`,
                src: filePath,
                title: metadata.title || fileName.replace(/\.[^/.]+$/, ""),
                artist: metadata.artist || "Artista Desconhecido",
                picture: metadata.picture || null,
                duration: 0 // Será preenchido quando a faixa for carregada
            };
        } catch (error) {
            console.error(`Erro ao carregar a música: ${fileName}`, error);
            return null;
        }
    });
    const results = await Promise.all(trackPromises);
    return results.filter(track => track !== null); // Filtra músicas que falharam ao carregar
}

/** Renderiza a lista de faixas na tela. */
function render(currentIndex = -1) {
    if (!playlistElement) return;
    playlistElement.innerHTML = '';
    
    if (trackList.length === 0) {
        playlistElement.innerHTML = `<li class="playlist-empty">Nenhuma música encontrada. Verifique a pasta 'musics/' e o arquivo 'music-list.js'.</li>`;
        return;
    }

    trackList.forEach((track, index) => {
        const li = document.createElement('li');
        li.className = 'playlist-item';
        li.dataset.index = index;
        li.draggable = true;
        if (index === currentIndex) {
            li.classList.add('playing');
        }

        const artHtml = track.picture
            ? `<img src="${track.picture}" alt="${track.title}" />`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;

        li.innerHTML = `
            <div class="playlist-item-art">${artHtml}</div>
            <div class="playlist-item-info">
                <div class="playlist-item-title">${track.title}</div>
                <div class="playlist-item-artist">${track.artist}</div>
            </div>
        `;

        li.addEventListener('click', () => onTrackSelectCallback(index));
        playlistElement.appendChild(li);
    });
}

/** Calcula o índice da próxima faixa a ser tocada. */
function getNextTrackIndex(currentIndex, loopMode) {
    if (trackList.length === 0) return -1;

    let nextIndex = currentIndex + 1;
    if (nextIndex >= trackList.length) {
        if (loopMode === 'all') {
            return 0; // Volta para o início
        }
        return -1; // Fim da playlist
    }
    return nextIndex;
}

/** Filtra a playlist com base em um termo de busca. */
function filter(searchTerm) {
    const lowerCaseTerm = searchTerm.toLowerCase();
    const items = playlistElement.querySelectorAll('.playlist-item');
    let hasResults = false;

    items.forEach((item, index) => {
        const track = trackList[index];
        const isVisible = 
            track.title.toLowerCase().includes(lowerCaseTerm) || 
            track.artist.toLowerCase().includes(lowerCaseTerm);
        
        item.classList.toggle('hidden', !isVisible);
        if (isVisible) hasResults = true;
    });

    // Mostra mensagem se nenhum resultado for encontrado
    if (!document.querySelector('.playlist-empty')) {
         const emptyMsg = document.createElement('li');
         emptyMsg.className = 'playlist-empty';
         emptyMsg.textContent = 'Nenhum resultado encontrado.';
         emptyMsg.style.display = hasResults ? 'none' : 'block';
         playlistElement.appendChild(emptyMsg);
    } else {
        document.querySelector('.playlist-empty').style.display = hasResults ? 'none' : 'block';
    }
}


/** Embaralha ou restaura a ordem da playlist. */
function shuffle(isShuffled) {
    if (isShuffled) {
        // Algoritmo Fisher-Yates para embaralhar
        const shuffledList = [...originalTrackList];
        for (let i = shuffledList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]];
        }
        trackList = shuffledList;
    } else {
        trackList = [...originalTrackList];
    }
    render();
    return trackList;
}

// --- Lógica de Drag and Drop ---
let draggedItem = null;

function addDragAndDropEvents() {
    playlistElement.addEventListener('dragstart', (e) => {
        draggedItem = e.target.closest('.playlist-item');
        if (draggedItem) {
            setTimeout(() => draggedItem.classList.add('ghost'), 0);
        }
    });

    playlistElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        const target = e.target.closest('.playlist-item');
        if (target && target !== draggedItem) {
            const rect = target.getBoundingClientRect();
            const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > .5;
            playlistElement.insertBefore(draggedItem, next && target.nextSibling || target);
        }
    });

    playlistElement.addEventListener('dragend', () => {
        if (draggedItem) {
            draggedItem.classList.remove('ghost');
            draggedItem = null;
            // Atualiza a ordem do array 'trackList'
            const newOrder = [...playlistElement.querySelectorAll('.playlist-item')].map(item => {
                const oldIndex = parseInt(item.dataset.index, 10);
                return trackList.find((_, i) => i === oldIndex);
            });
            trackList = newOrder;
            // Re-renderiza para atualizar os data-index
            render();
        }
    });
}


export {
    init,
    createPlaylistFromFiles,
    render,
    getNextTrackIndex,
    shuffle,
    filter
};
