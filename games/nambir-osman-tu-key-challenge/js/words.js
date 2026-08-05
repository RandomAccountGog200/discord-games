export const wordPool = [
    'nambir', 'osman', 'tus',
    'bir', 'iki', 'uc',
    'key', 'game', 'type', 'speed', 'fast', 'word',
    'apple', 'banana', 'cherry', 'delta', 'eagle', 'falcon', 'galaxy', 'hacker', 'impact', 'jungle',
    'knight', 'lemon', 'matrix', 'nebula', 'oxygen', 'pixel', 'quantum', 'rocket', 'storm', 'tiger',
    'umbrella', 'volcano', 'window', 'xylophone', 'yellow', 'zebra'
];

export function getWordForLevel(level) {
    // For early levels, use shorter words; later levels can use full pool
    if (level <= 1) {
        return wordPool.slice(0, 6); // nambir, osman, tus, bir, iki, uc
    } else if (level <= 3) {
        return wordPool.slice(0, 12); // add key, game, type, speed, fast, word
    } else {
        return wordPool; // all words
    }
}