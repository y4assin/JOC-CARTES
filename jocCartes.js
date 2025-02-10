const WebSocket = require('ws');
const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const PORT = process.env.PORT || 3001;

const wss = new WebSocket.Server({ server });

console.log(`Servidor WebSocket iniciado en puerto ${PORT}`);

app.use(express.static('public'));

class JuegoCartas {
    constructor() {
        this.baraja = [];
        this.jugadores = [];
        this.cartasSeleccionadas = new Map();
        this.turnoActual = 0;
        this.inicializarBaraja();
        this.mezclarBaraja();
    }

    inicializarBaraja() {
        const valores = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const palos = ['C', 'D', 'H', 'S']; // C=♣, D=♦, H=♥, S=♠
        
        for (let valor of valores) {
            for (let palo of palos) {
                this.baraja.push({
                    valor: valor,
                    palo: palo,
                    imagen: `/cards/${valor}-${palo}.png`
                });
            }
        }
    }

    mezclarBaraja() {
        for (let i = this.baraja.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.baraja[i], this.baraja[j]] = [this.baraja[j], this.baraja[i]];
        }
    }

    repartirCartas() {
        this.mezclarBaraja();
        return [
            this.baraja.slice(0, 5),
            this.baraja.slice(5, 10)
        ];
    }

    determinarGanador(carta1, carta2) {
        const valores = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        
        console.log('Comparando cartas:', {
            jugador1: `${carta1.valor}-${carta1.palo}`,
            jugador2: `${carta2.valor}-${carta2.palo}`,
            valor1: valores[carta1.valor],
            valor2: valores[carta2.valor]
        });

        if (valores[carta1.valor] === valores[carta2.valor]) {
            return 'empate';
        }
        
        if (valores[carta1.valor] > valores[carta2.valor]) {
            return 0;  // Gana jugador 1
        } else {
            return 1;  // Gana jugador 2
        }
    }
}

const juego = new JuegoCartas();

wss.on('connection', (ws) => {
    console.log('Nueva conexión establecida');
    
    if (juego.jugadores.length >= 2) {
        console.log('Partida llena');
        ws.send(JSON.stringify({
            tipo: 'error',
            mensaje: 'La partida está llena'
        }));
        ws.close();
        return;
    }

    ws.jugadorId = juego.jugadores.length;
    juego.jugadores.push(ws);
    console.log(`Jugador ${ws.jugadorId + 1} conectado`);

    ws.send(JSON.stringify({
        tipo: 'conexion',
        jugadorId: ws.jugadorId,
        turnoActual: juego.turnoActual
    }));

    if (juego.jugadores.length === 2) {
        console.log('Iniciando partida...');
        const manos = juego.repartirCartas();
        juego.jugadores.forEach((jugador, id) => {
            jugador.send(JSON.stringify({
                tipo: 'inicioJuego',
                mano: manos[id],
                turnoActual: juego.turnoActual
            }));
        });
    }

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Mensaje recibido:', data); // Debug

        if (data.tipo === 'seleccionCarta') {
            juego.cartasSeleccionadas.set(ws.jugadorId, data.carta);
            juego.turnoActual = (juego.turnoActual + 1) % 2;

            if (juego.cartasSeleccionadas.size === 2) {
                const carta1 = juego.cartasSeleccionadas.get(0);
                const carta2 = juego.cartasSeleccionadas.get(1);
                const resultado = juego.determinarGanador(carta1, carta2);

                console.log('Resultado:', resultado); // Debug

                juego.jugadores.forEach((jugador) => {
                    jugador.send(JSON.stringify({
                        tipo: 'resultado',
                        ganador: resultado,
                        cartas: {
                            jugador0: carta1,
                            jugador1: carta2
                        }
                    }));
                });

                // Reiniciar para nueva ronda
                setTimeout(() => {
                    juego.cartasSeleccionadas.clear();
                    juego.turnoActual = 0;
                    const nuevasManos = juego.repartirCartas();
                    
                    juego.jugadores.forEach((jugador, id) => {
                        jugador.send(JSON.stringify({
                            tipo: 'nuevaRonda',
                            mano: nuevasManos[id],
                            turnoActual: 0
                        }));
                    });
                }, 2000);
            }
        }
    });

    ws.on('close', () => {
        console.log(`Jugador ${ws.jugadorId + 1} desconectado`);
        const index = juego.jugadores.indexOf(ws);
        if (index > -1) {
            juego.jugadores.splice(index, 1);
        }
    });
});

// Iniciar el servidor HTTP
server.listen(PORT, () => {
    console.log(`Servidor WebSocket iniciado en puerto ${PORT}`);
});

// Manejar errores del servidor
server.on('error', (error) => {
    console.error('Error en el servidor:', error);
});

// Manejar errores de WebSocket
wss.on('error', (error) => {
    console.error('Error en WebSocket:', error);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
