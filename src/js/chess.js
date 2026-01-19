document.addEventListener('DOMContentLoaded', () => {
    renderPieces();
}); // CARGA las piezas cuando se carga el resto del documento, pero probablemente no haga nada


const board = document.querySelector('#board'); // Pilla el tablero
const size = 1;

const game = new Chess(); // motor de ajedrez
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
        square.setAttribute('position', `${x - 3.5} 0 ${z - 3.5}`);
        square.setAttribute('color', (x + z) % 2 === 0 ? '#fff' : '#000');

        square.dataset.x = x;
        square.dataset.z = z;

        square.classList.add('square');

        //Se le añade la funcionalidad a cada casilla

        square.addEventListener('click', () => {
            if (!selectedPiece || !selectedSquare) return;
            //Pilla la posicion de la casilla
            const x = Number(square.dataset.x);
            const z = Number(square.dataset.z);

            //Devuelve la posicion en nomenclatura de ajedrez
            const target = toChessSquare(x, z);

            //Donde coño estoy y que he tocao, ahora en nuestra consola de confianza
            console.log({
                selectedSquare,
                target,
                turn: game.turn(),
                piece: game.get(selectedSquare)
            });

            //De quien coño es el turno
            console.log('Turno:', game.turn()); // 'w' o 'b'

            //Si dios lo tuviese en su gracia el movimiento que se esta haciendo ej. e5 a e7
            const move = game.move({
                from: selectedSquare,
                to: target,
                promotion: 'q'
            });

            //Donde coño estoy y que coño estoy haciendo 2: ahora es personal y con el movimiento de las caderas macarena
            console.log('from:', selectedSquare, 'to:', target);
            console.log('move:', move);

            //Comprueba que el movimiento es valido 
            if (move) {
                console.log('Movimiento válido:', move);
                renderPieces();
                checkGameState();
            } else {
                console.log('Movimiento ilegal');
            }

            //Hace que no se este tocando nada otra vez, guarindongolo
            selectedPiece = null;
            selectedSquare = null;
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
            //Me creo las piezas 
            const el = document.createElement('a-cylinder');
            el.setAttribute('radius', 0.3);
            el.setAttribute('height', 0.6);
            el.setAttribute('color', piece.color === 'w' ? '#EEE':  '#222' );
            el.setAttribute('position', `${x - 3.5} 0.3 ${z - 3.5}`);

            el.dataset.x = x;
            el.dataset.z = z;
            el.dataset.square = toChessSquare(x, z);

            el.addEventListener('click', () => {
                if (game.turn() !== piece.color) return;

                selectedPiece = el;
                selectedSquare = el.dataset.square;
                console.log('Seleccionada:', selectedSquare);
            });

            container.appendChild(el);
        });
    });
}



function checkGameState() {
    if (game.in_check()) {
        console.log('¡JAQUE!');
    }

    /* if (game.isCheckmate()) {
        alert('♟️ JAQUE MATE');
    } */

    /* if (game.isDraw()) {
        alert('Empate');
    } */
}




