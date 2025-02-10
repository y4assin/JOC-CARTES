const WebSocket = require('ws');
const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

class JuegoCartas {
    constructor() {
        this.baraja = [];
        this.jugadores = [];
        this.cartasSeleccionadas = new Map();
        this.turnoActual = 0;
        this.inicializarBaraja();
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
    if (juego.jugadores.length >= 2) {
        ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Partida llena' }));
        ws.close();
        return;
    }

    const jugadorId = juego.jugadores.length;
    juego.jugadores.push(ws);
    ws.jugadorId = jugadorId;

    ws.send(JSON.stringify({ 
        tipo: 'conexion', 
        jugadorId: jugadorId,
        turnoActual: juego.turnoActual
    }));

    if (juego.jugadores.length === 2) {
        repartirNuevaRonda();
    }

    ws.on('message', (mensaje) => {
        const data = JSON.parse(mensaje);
        
        if (data.tipo === 'seleccionCarta') {
            if (ws.jugadorId !== juego.turnoActual) {
                ws.send(JSON.stringify({
                    tipo: 'error',
                    mensaje: 'No es tu turno'
                }));
                return;
            }

            juego.cartasSeleccionadas.set(ws.jugadorId, data.carta);
            
            juego.turnoActual = (juego.turnoActual + 1) % 2;
            
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
                
                // Primero solo enviamos el resultado
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

                // Esperamos 2 segundos para mostrar el resultado
                setTimeout(() => {
                    juego.cartasSeleccionadas.clear();
                    juego.turnoActual = 0;
                    const nuevasManos = juego.repartirCartas();
                    
                    // Luego enviamos las nuevas cartas
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

    function repartirNuevaRonda() {
        const manos = juego.repartirCartas();
        juego.jugadores.forEach((jugador, id) => {
            jugador.send(JSON.stringify({
                tipo: 'nuevaRonda',
                mano: manos[id],
                turnoActual: juego.turnoActual
            }));
        });
    }

    ws.on('close', () => {
        juego.jugadores = juego.jugadores.filter(j => j !== ws);
        juego.cartasSeleccionadas.delete(ws.jugadorId);
        
        // Notificar a los jugadores restantes
        juego.jugadores.forEach((jugador) => {
            jugador.send(JSON.stringify({
                tipo: 'jugadorDesconectado',
                mensaje: 'El otro jugador se ha desconectado'
            }));
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
