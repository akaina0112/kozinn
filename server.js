const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// 静的ファイルの提供
app.use(express.static('.'));

// プレイヤーの状態を保持
const players = new Map();

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // 新しいプレイヤーの初期化
    players.set(socket.id, {
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        health: 100,
        device: socket.handshake.headers['user-agent'].includes('Mobile') ? 'mobile' : 'desktop'
    });

    // 既存のプレイヤー情報を要求された場合
    socket.on('requestPlayers', () => {
        const playerList = Array.from(players.entries()).map(([id, data]) => ({
            id,
            position: data.position,
            rotation: data.rotation,
            health: data.health,
            device: data.device
        }));
        socket.emit('playerList', playerList);
    });

    // プレイヤーの位置更新
    socket.on('playerUpdate', (data) => {
        const player = players.get(socket.id);
        if (player) {
            player.position = data.position;
            player.rotation = data.rotation;
            // 他のプレイヤーに位置を送信
            socket.broadcast.emit('playerUpdate', {
                id: socket.id,
                position: data.position,
                rotation: data.rotation
            });
        }
    });

    // プレイヤーの切断
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        players.delete(socket.id);
        io.emit('playerDisconnected', socket.id);
    });
});

// サーバーの起動
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 