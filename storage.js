// scripts/storage.js

/**
 * Salva uma preferência no localStorage.
 * @param {string} key A chave da preferência (ex: 'volume').
 * @param {any} value O valor a ser salvo.
 */
function savePreference(key, value) {
    try {
        localStorage.setItem(`musicPlayer_${key}`, JSON.stringify(value));
    } catch (error) {
        console.error("Erro ao salvar preferência:", error);
    }
}

/**
 * Carrega uma preferência do localStorage.
 * @param {string} key A chave da preferência.
 * @param {any} defaultValue O valor padrão a ser retornado se a chave não existir.
 * @returns {any} O valor salvo ou o padrão.
 */
function loadPreference(key, defaultValue) {
    try {
        const value = localStorage.getItem(`musicPlayer_${key}`);
        return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
        console.error("Erro ao carregar preferência:", error);
        return defaultValue;
    }
}

export { savePreference, loadPreference };
