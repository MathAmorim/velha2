document.addEventListener('DOMContentLoaded', () => {
    const gameConfig = {
        maxSuperBoardSize: 500,
        currentPlayer: 'X',
        activeBoard: null,
        gameActive: true,
        aiEnabled: false,
        aiDifficulty: 'normal', // 'easy' ou 'normal'
        aiPlayer: 'O',
        winningBoards: []
    };

    // Elementos do DOM
    const superBoard = document.getElementById('super-board');
    const currentPlayerDisplay = document.getElementById('current-player');
    const activeBoardDisplay = document.getElementById('active-board');
    const resultDisplay = document.getElementById('result');
    const resetButton = document.getElementById('reset-btn');
    const aiToggleButton = document.getElementById('ai-toggle-btn');
    const aiDifficultyButton = document.getElementById('ai-difficulty-btn');
    const rulesButton = document.getElementById('rules-btn');
    const rulesModal = document.getElementById('rules-modal');
    const closeButton = document.querySelector('.close');

    // Estado do jogo
    let { currentPlayer, activeBoard, gameActive, aiEnabled, aiDifficulty, aiPlayer } = gameConfig;
    const boardsState = Array(9).fill().map(() => Array(9).fill(''));
    const boardsResults = Array(9).fill(null);
    
    // Condições de vitória
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // linhas
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // colunas
        [0, 4, 8], [2, 4, 6]             // diagonais
    ];
    
    // Inicializa o jogo
    function initGame() {
        document.documentElement.style.setProperty(
            '--max-super-board-size', 
            `${gameConfig.maxSuperBoardSize}px`
        );
        
        createBoards();
        updatePlayerDisplay();
        updateActiveBoardDisplay();
        updateAiButton();
        
        if (aiEnabled && currentPlayer === aiPlayer && gameActive) {
            setTimeout(makeAiMove, 500);
        }
    }
    
    // Cria os tabuleiros
    function createBoards() {
        superBoard.innerHTML = '';
        
        boardsState.forEach((board, boardIndex) => {
            const boardElement = document.createElement('div');
            boardElement.className = 'board';
            boardElement.dataset.index = boardIndex;
            
            if (boardsResults[boardIndex] === 'X') {
                boardElement.classList.add('won-x');
            } else if (boardsResults[boardIndex] === 'O') {
                boardElement.classList.add('won-o');
            } else if (boardsResults[boardIndex] === 'D') {
                boardElement.classList.add('draw');
            }
            
            if (gameActive && (activeBoard === boardIndex || activeBoard === null)) {
                boardElement.classList.add(currentPlayer === 'X' ? 'active-x' : 'active-o');
            }
            
            if (!gameActive && gameConfig.winningBoards.includes(boardIndex)) {
                boardElement.classList.add('global-win');
            }
            
            board.forEach((cellState, cellIndex) => {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.boardIndex = boardIndex;
                cell.dataset.cellIndex = cellIndex;
                
                if (cellState === 'X') {
                    cell.textContent = 'X';
                    cell.classList.add('x');
                } else if (cellState === 'O') {
                    cell.textContent = 'O';
                    cell.classList.add('o');
                }
                
                cell.addEventListener('click', () => handleCellClick(boardIndex, cellIndex));
                boardElement.appendChild(cell);
            });
            
            superBoard.appendChild(boardElement);
        });
    }
    
    // Manipula o clique na célula
    function handleCellClick(boardIndex, cellIndex) {
        if (!isMoveValid(boardIndex, cellIndex)) return;
        
        makeMove(boardIndex, cellIndex);
        
        // Se a IA está habilitada e o jogo não terminou, faz a jogada da IA
        if (aiEnabled && gameActive && currentPlayer === aiPlayer) {
            setTimeout(makeAiMove, 500);
        }
    }
    
    // Faz uma jogada
    function makeMove(boardIndex, cellIndex) {
        boardsState[boardIndex][cellIndex] = currentPlayer;
        checkBoardResult(boardIndex);
        updateActiveBoard(cellIndex);
        checkGlobalResult();
        
        if (gameActive) {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updatePlayerDisplay();
            createBoards();
        }
    }
    
    // Faz a jogada da IA
    function makeAiMove() {
        if (!gameActive || currentPlayer !== aiPlayer) return;
        
        if (aiDifficulty === 'easy') {
            makeRandomMove();
        } else {
            makeSmartMove();
        }
    }

    function makeRandomMove() {
        const validMoves = getValidMoves();
        if (validMoves.length > 0) {
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            makeMove(randomMove.boardIndex, randomMove.cellIndex);
        }
    }

    function makeSmartMove() {
        const validMoves = getValidMoves();
        if (validMoves.length === 0) return;

        // 1. Verifica se pode vencer em algum tabuleiro
        for (const move of validMoves) {
            const { boardIndex, cellIndex } = move;
            const originalValue = boardsState[boardIndex][cellIndex];
            boardsState[boardIndex][cellIndex] = aiPlayer;
            
            if (checkImmediateWin(boardIndex)) {
                boardsState[boardIndex][cellIndex] = originalValue;
                return makeMove(boardIndex, cellIndex);
            }
            boardsState[boardIndex][cellIndex] = originalValue;
        }

        // 2. Bloqueia vitória do jogador
        for (const move of validMoves) {
            const { boardIndex, cellIndex } = move;
            const originalValue = boardsState[boardIndex][cellIndex];
            boardsState[boardIndex][cellIndex] = 'X';
            
            if (checkImmediateWin(boardIndex)) {
                boardsState[boardIndex][cellIndex] = originalValue;
                return makeMove(boardIndex, cellIndex);
            }
            boardsState[boardIndex][cellIndex] = originalValue;
        }

        // 3. Prioriza o centro e cantos
        const centerAndCorners = [0, 2, 4, 6, 8]; // Índices das células centrais e de canto
        const goodMoves = validMoves.filter(move => 
            centerAndCorners.includes(move.cellIndex)
        );
        
        if (goodMoves.length > 0) {
            return makeMove(
                goodMoves[0].boardIndex, 
                goodMoves[0].cellIndex
            );
        }

        // 4. Se nenhuma estratégia aplicável, faz movimento aleatório
        makeRandomMove();
    }

    function getValidMoves() {
        const validMoves = [];
        for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
            if (activeBoard !== null && activeBoard !== boardIndex) continue;
            if (boardsResults[boardIndex] !== null) continue;
            
            for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
                if (boardsState[boardIndex][cellIndex] === '') {
                    validMoves.push({ boardIndex, cellIndex });
                }
            }
        }
        return validMoves;
    }

    function checkImmediateWin(boardIndex) {
        const board = boardsState[boardIndex];
        for (const condition of winningConditions) {
            const [a, b, c] = condition;
            if (board[a] && board[a] === board[b] && board[b] === board[c]) {
                return true;
            }
        }
        return false;
    }

    function toggleAIDifficulty() {
        aiDifficulty = aiDifficulty === 'easy' ? 'normal' : 'easy';
        updateAiDifficultyButton();
    }

    function updateAiDifficultyButton() {
        aiDifficultyButton.textContent = `Dificuldade: ${aiDifficulty === 'easy' ? 'Fácil' : 'Normal'}`;
        aiDifficultyButton.className = aiDifficulty === 'easy' ? 'easy' : 'normal';
    }

    // Verifica se a jogada é válida
    function isMoveValid(boardIndex, cellIndex) {
        return (
            gameActive &&
            (activeBoard === null || activeBoard === boardIndex) &&
            boardsResults[boardIndex] === null &&
            boardsState[boardIndex][cellIndex] === '' &&
            (!aiEnabled || currentPlayer !== aiPlayer)
        );
    }
    
    // Verifica resultado em um tabuleiro
    function checkBoardResult(boardIndex) {
        const board = boardsState[boardIndex];
        
        for (const condition of winningConditions) {
            const [a, b, c] = condition;
            if (board[a] && board[a] === board[b] && board[b] === board[c]) {
                boardsResults[boardIndex] = board[a];
                return;
            }
        }
        
        if (!board.includes('')) {
            boardsResults[boardIndex] = 'D';
        }
    }
    
    // Atualiza o tabuleiro ativo
    function updateActiveBoard(cellIndex) {
        activeBoard = boardsResults[cellIndex] === null ? cellIndex : null;
        updateActiveBoardDisplay();
    }
    
    // Verifica resultado global
    function checkGlobalResult() {
        for (const condition of winningConditions) {
            const [a, b, c] = condition;
            if (boardsResults[a] && boardsResults[a] !== 'D' && 
                boardsResults[a] === boardsResults[b] && 
                boardsResults[b] === boardsResults[c]) {
                gameConfig.winningBoards = [a, b, c];
                endGame(`Jogador ${boardsResults[a]} venceu o jogo global!`);
                return;
            }
        }
        
        if (!boardsResults.includes(null)) {
            endGame('Empate global!');
        }
    }
    
    // Finaliza o jogo
    function endGame(message) {
        gameActive = false;
        activeBoard = null;
        resultDisplay.textContent = message;
        createBoards();
    }
    
    // Atualiza a exibição do jogador atual
    function updatePlayerDisplay() {
        currentPlayerDisplay.textContent = currentPlayer;
        currentPlayerDisplay.className = `player-${currentPlayer.toLowerCase()}`;
    }
    
    // Atualiza a exibição do tabuleiro ativo
    function updateActiveBoardDisplay() {
        activeBoardDisplay.textContent = activeBoard === null ? 'Qualquer um' : `Tabuleiro ${activeBoard + 1}`;
    }
    
    // Atualiza o botão da IA
    function updateAiButton() {
        aiToggleButton.textContent = aiEnabled ? 'Desativar IA' : 'Ativar IA (O)';
        aiToggleButton.classList.toggle('active', aiEnabled);
    }
    
    // Alterna a IA
    function toggleAI() {
        aiEnabled = !aiEnabled;
        updateAiButton();
        
        // Se a IA foi ativada e é a vez dela, faz a jogada
        if (aiEnabled && currentPlayer === aiPlayer && gameActive) {
            setTimeout(makeAiMove, 500);
        }
    }
    
    // Reinicia o jogo
    function resetGame() {
        currentPlayer = gameConfig.currentPlayer;
        activeBoard = gameConfig.activeBoard;
        gameActive = gameConfig.gameActive;
        gameConfig.winningBoards = [];
        
        for (let i = 0; i < 9; i++) {
            boardsState[i] = Array(9).fill('');
            boardsResults[i] = null;
        }
        
        resultDisplay.textContent = '';
        updatePlayerDisplay();
        updateActiveBoardDisplay();
        createBoards();
        
        // Se a IA está habilitada e é a vez dela, faz a jogada
        if (aiEnabled && currentPlayer === aiPlayer) {
            setTimeout(makeAiMove, 500);
        }
        rulesModal.style.display = 'none';
    }
    
    // Event listeners
    resetButton.addEventListener('click', resetGame);
    aiToggleButton.addEventListener('click', toggleAI);
    
    // Inicia o jogo
    initGame();

    // Adicione os event listeners para o modal
    rulesButton.addEventListener('click', () => {
        rulesModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        rulesModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === rulesModal) {
            rulesModal.style.display = 'none';
        }
    });
});