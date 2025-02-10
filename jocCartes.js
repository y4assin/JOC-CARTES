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
        this.inicializarBaraja();  // Reiniciar baraja en cada reparto
        this.mezclarBaraja();
        const manos = [[], []];
        for (let i = 0; i < 5; i++) {
            manos[0].push(this.baraja.pop());
            manos[1].push(this.baraja.pop());
        }
        return manos;
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

    // Enviar estado inicial al jugador
    ws.send(JSON.stringify({
        tipo: 'conexion',
        jugadorId: ws.jugadorId,
        turnoActual: juego.turnoActual
    }));

    // Si tenemos 2 jugadores, iniciar el juego
    if (juego.jugadores.length === 2) {
        console.log('Iniciando partida...');
        const manos = juego.repartirCartas();
        juego.turnoActual = 0; // Asegurar que empiece el jugador 1
        
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
        console.log('Mensaje recibido:', data);

        if (data.tipo === 'seleccionCarta') {
            // Verificar que sea el turno del jugador
            if (ws.jugadorId !== juego.turnoActual) {
                ws.send(JSON.stringify({
                    tipo: 'error',
                    mensaje: 'No es tu turno'
                }));
                return;
            }

            juego.cartasSeleccionadas.set(ws.jugadorId, data.carta);
            juego.turnoActual = (juego.turnoActual + 1) % 2;

            // Notificar a todos del cambio de turno
            juego.jugadores.forEach((jugador) => {
                jugador.send(JSON.stringify({
                    tipo: 'cambioTurno',
                    turnoActual: juego.turnoActual
                }));
            });

            if (juego.cartasSeleccionadas.size === 2) {
                const carta1 = juego.cartasSeleccionadas.get(0);
                const carta2 = juego.cartasSeleccionadas.get(1);
                const resultado = juego.determinarGanador(carta1, carta2);

                console.log('Resultado de la ronda:', resultado);

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

                // Nueva ronda después de mostrar resultado
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
            // Notificar al otro jugador
            if (juego.jugadores.length > 0) {
                juego.jugadores[0].send(JSON.stringify({
                    tipo: 'oponenteDesconectado'
                }));
            }
        }
        // Reiniciar el juego
        juego.cartasSeleccionadas.clear();
        juego.turnoActual = 0;
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
