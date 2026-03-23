document.addEventListener('DOMContentLoaded', () => {
    console.log("MI SCRIPT CARGADO");
    renderPieces();
    console.log("Chess existe?", typeof Chess);
}); // CARGA las piezas cuando se carga el resto del documento, pero probablemente no haga nada

const BOARD_OFFSET = 3.5;
const MODEL_MAP = {
    p: { w: '#pawn-w', b: '#pawn-b' },
    r: { w: '#rook-w', b: '#rook-b' },
    n: { w: '#knight-w', b: '#knight-b' },
    b: { w: '#bishop-w', b: '#bishop-b' },
    q: { w: '#queen-w', b: '#queen-b' },
    k: { w: '#king-w', b: '#king-b' }
};

//let listaCuadrados = ;

const board = document.querySelector('#board'); // Pilla el tablero
const size = 1;

//const game = new Chess(); // motor de ajedrez
let game = new Chess();

game.clear();

game.put({ type: 'k', color: 'b' }, 'g1');
game.put({ type: 'r', color: 'b' }, 'f1');
game.put({ type: 'p', color: 'b' }, 'g2');
game.put({ type: 'p', color: 'b' }, 'f2');
game.put({ type: 'p', color: 'b' }, 'h3');


game.put({ type: 'q', color: 'w' }, 'g7');
game.put({ type: 'r', color: 'w' }, 'g8');
game.put({ type: 'k', color: 'w' }, 'd7');

game.load(game.fen());


let selectedPiece = null;
let selectedSquare = null;

//Recorre todos las casillas
for (let x = 0; x < 8; x++) {
    for (let z = 0; z < 8; z++) {

        //Crea una casilla
        const square = document.createElement('a-plane');

        square.setAttribute('width', 1);
        square.setAttribute('height', 1);
        square.setAttribute('rotation', '-90 0 0');
        square.setAttribute('position', `${x - 3.5} 0.2 ${z - 3.5}`);
        square.setAttribute('color', (x + z) % 2 === 0 ? '#fff' : '#000');
        square.setAttribute('data-raycastable', '');
        square.setAttribute('opacity', 0);
        square.setAttribute('material', 'transparent: true');
        square.dataset.x = x;
        square.dataset.z = z;
        //Se le añade la funcionalidad a cada casilla

        square.addEventListener('click', () => {
            if (!selectedSquare) return; // nada seleccionado

            const sqX = Number(square.dataset.x);
            const sqZ = Number(square.dataset.z);
            const targetSquare = toChessSquare(sqX, sqZ);

            const move = game.move({
                from: selectedSquare,
                to: targetSquare,
                promotion: 'q'
            });

            if (move) {
                console.log('Movimiento válido:', move);

                // Captura
                if (move.captured) {
                    const capturedPiece = document.querySelector(`#pieces [data-square="${targetSquare}"]`);
                    if (capturedPiece) capturedPiece.remove();
                }

                renderPieces();
                checkGameState();
            } else {
                console.log('Movimiento ilegal');
            }

            selectedSquare = null; // resetea selección
        });

        board.appendChild(square);
    }
}

const pieces = document.querySelector('#pieces');



// Esta funcion devuelve la posicion a nomenclatura de ajedrez
function toChessSquare(x, z) {
    const files = 'abcdefgh';
    return files[x] + (8 - z);
}

function renderPieces() {

    //Pilla el contenedor de las piezas
    const container = document.querySelector('#pieces');
    container.innerHTML = '';

    //Recorro todos las filas en busca de piezas
    //La libreria es un locuron y entiende que es cada cosa desde donde esta en el tablero
    game.board().forEach((row, z) => {
        row.forEach((piece, x) => {
            if (!piece) return;
            const el = document.createElement('a-entity');

            const model = MODEL_MAP[piece.type][piece.color];
            console.log(piece.type, piece.color, MODEL_MAP[piece.type]);
            el.setAttribute('gltf-model', model);

            // Ajustes típicos (depende de tu modelo)
            el.setAttribute('scale', '0.8 0.8 0.8');
            el.setAttribute('rotation', '0 0 0');
            el.setAttribute('data-raycastable', '');



            el.setAttribute('position', `${x - 3.5} 0.3 ${z - 3.5}`);

            //el.setAttribute('animation', `property: position; dur: 300; to: ${x - 3.5} 0.01 ${z - 3.5}`);


            el.dataset.x = x;
            el.dataset.z = z;
            el.dataset.square = toChessSquare(x, z);

            // el.addEventListener('click', () => {
            //     if (game.turn() !== piece.color) return;



            //     selectedPiece = el;
            //     selectedSquare = el.dataset.square;
            //     console.log('Seleccionada:', selectedSquare);
            // });

            el.addEventListener('click', () => {
                const pieceColor = piece.color;
                const pieceSquare = el.dataset.square;

                // Si no hay pieza seleccionada → selecciona esta pieza si es tu turno
                if (!selectedSquare) {
                    if (game.turn() !== pieceColor) return;
                    selectedSquare = pieceSquare;
                    console.log('Seleccionada:', selectedSquare);
                    return;
                }

                // Si la pieza seleccionada es del mismo color → cambia selección
                if (pieceColor === game.get(selectedSquare).color) {
                    selectedSquare = pieceSquare;
                    console.log('Seleccionada (cambio):', selectedSquare);
                    return;
                }

                // Intentar mover a esta pieza (captura)
                const move = game.move({
                    from: selectedSquare,
                    to: pieceSquare,
                    promotion: 'q'
                });

                if (move) {
                    console.log('Movimiento válido:', move);

                    // Captura
                    if (move.captured) {
                        const capturedPiece = document.querySelector(`#pieces [data-square="${pieceSquare}"]`);
                        if (capturedPiece) capturedPiece.remove();
                    }

                    renderPieces();
                    checkGameState();
                } else {
                    console.log('Movimiento ilegal');
                }

                selectedSquare = null; // resetea selección
            });

            container.appendChild(el);
        });
    });
}

function EliminarPiezas() {
    const piezas = document.querySelector('#pieces');
    piezas.innerHTML = '';
}
function spawnKey() {

    const scene = document.querySelector('a-scene');

    const key = document.createElement('a-entity');

    key.setAttribute('id', 'Llave');
    key.setAttribute('gltf-model', '#llave');
    key.setAttribute('position', '-25 16 21');
    key.setAttribute('rotation', '0 90 0');
    key.setAttribute('scale', '1 1 1');

    key.setAttribute('data-raycastable', '');
    key.setAttribute('key-pickup', '');

    scene.appendChild(key);
}

function checkGameState() {
    if (game.in_check()) {
        
        spawnKey();
        return;
    } else {

        const msgEl = document.getElementById('mensajePuzzle') || document.getElementById('row-display');
        if (msgEl) {
            msgEl.textContent = 'Intento fallido. ¡Inténtalo de nuevo!';
            if (msgEl.style) msgEl.style.display = 'block';
            setTimeout(() => { if (msgEl.style) msgEl.style.display = 'none'; }, 2500);
        }
        EliminarPiezas();

        game = new Chess();

        game.clear();

        game.put({ type: 'k', color: 'b' }, 'g1');
        game.put({ type: 'r', color: 'b' }, 'f1');
        game.put({ type: 'p', color: 'b' }, 'g2');
        game.put({ type: 'p', color: 'b' }, 'f2');
        game.put({ type: 'p', color: 'b' }, 'h3');


        game.put({ type: 'q', color: 'w' }, 'g7');
        game.put({ type: 'r', color: 'w' }, 'g8');
        game.put({ type: 'k', color: 'w' }, 'd7');

        game.load(game.fen());

        renderPieces();
        return;
    }

}