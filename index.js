import { Server } from "socket.io";
import fs from "fs";
import https from "https";

// const httpsOptions = {
// 	key: fs.readFileSync("/etc/letsencrypt/live/ruehan-home.com/privkey.pem"),
// 	cert: fs.readFileSync("/etc/letsencrypt/live/ruehan-home.com/fullchain.pem"),
// };

// const httpsServer = https.createServer(httpsOptions);

const io = new Server({
	cors: {
		origin: "http://localhost:3002",
	},
});

io.listen(5000, () => {
	console.log("Secure Socket.IO server listening on port 5000");
});

const characters = [];

const items = {
	desk: {
		name: "Desk",
		size: [5, 6],
	},
	chair: {
		name: "Chair",
		size: [2, 2],
	},
	shelf: {
		name: "Shelf",
		size: [2, 3],
	},
	bass: {
		name: "Bass",
		size: [1, 1],
	},
};

const map = {
	size: [10, 15],
	gridDivision: 2,
	items: [
		{
			...items.chair,
			gridPosition: [16, 25],
		},
		{
			...items.desk,
			gridPosition: [15, 22],
		},
		{
			...items.bass,
			gridPosition: [14, 23],
		},
		{
			...items.shelf,
			gridPosition: [10, 23],
		},
	],
};

const generateRandomPosition = () => {
	return [Math.random() * map.size[0], 0, Math.random() * map.size[1]];
};

const generateRandomHexColor = () => {
	return "#" + Math.floor(Math.random() * 16777215).toString(16);
};

io.on("connection", (socket) => {
	console.log("user connected : ", socket.id);

	characters.push({
		id: socket.id,
		position: generateRandomPosition(),
		hairColor: generateRandomHexColor(),
		topColor: generateRandomHexColor(),
		bottomColor: generateRandomHexColor(),
	});

	socket.emit("hello", { map, characters, id: socket.id, items });

	io.emit("characters", characters);

	socket.on("move", (position) => {
		const character = characters.find(
			(character) => character.id === socket.id
		);
		character.position = position;
		io.emit("characters", characters);
	});

	socket.on("disconnect", (socket) => {
		console.log("user disconnected :", socket.id);

		characters.splice(
			characters.findIndex((character) => character.id === socket.id),
			1
		);
		io.emit("characters", characters);
	});
});
