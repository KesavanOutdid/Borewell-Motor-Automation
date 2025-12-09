const { Server } = require("socket.io");

function initSocket(server) {
    const io = new Server(server, {
        cors: { origin: "*" }
    });

    global.io = io;

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("subscribe", (serial) => {
            socket.join(serial);
            console.log(`Client ${socket.id} subscribed to ${serial}`);
        });

        socket.on("disconnect", () => {
            console.log(`Client disconnected ${socket.id}`);
        });
    });

    return io;
}

module.exports = initSocket;
