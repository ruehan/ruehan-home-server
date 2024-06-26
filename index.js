import { Server } from "socket.io";
import fs from "fs";
import https from "https";
import pathfinding from "pathfinding";

// const httpsOptions = {
// 	key: fs.readFileSync("/etc/letsencrypt/live/ruehan-home.com/privkey.pem"),
// 	cert: fs.readFileSync("/etc/letsencrypt/live/ruehan-home.com/fullchain.pem"),
// };

// const httpsServer = https.createServer(httpsOptions);

const io = new Server({
	cors: {
		origin: "http://ruehan-home.com",
		// origin: "http://220.119.73.171:3002",
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
	table: {
		name: "Table",
		size: [2, 3],
	},
	mac: {
		name: "Mac",
		size: [1, 1],
	},
	window: {
		name: "Window",
		size: [2, 1],
		wall: true,
	},
	desk_set: {
		name: "Desk-set",
		size: [6, 6],
	},
	bookcase: {
		name: "Bookcase",
		size: [3, 2],
	},
	piano: {
		name: "Piano",
		size: [2, 3],
	},
	box: {
		name: "Box",
		size: [2, 2],
	},
	closet: {
		name: "Closet",
		size: [2, 1],
	},
	bed: {
		name: "Bed",
		size: [3, 6],
	},
	wall: {
		name: "Wall",
		size: [8, 1],
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
		// {
		// 	...items.desk_set,
		// 	gridPosition: [14, 22],
		// },
		{
			...items.bass,
			gridPosition: [14, 23],
		},
		{
			...items.shelf,
			gridPosition: [10, 23],
		},
		{
			...items.bookcase,
			gridPosition: [10, 20],
			rotation: 1,
		},
		// {
		// 	...items.table,
		// 	gridPosition: [10, 27],
		// },
		{
			...items.piano,
			gridPosition: [11, 26],
		},
		{
			...items.mac,
			gridPosition: [17, 23],
		},
		{
			...items.window,
			gridPosition: [13, 30],
		},

		{
			...items.window,
			gridPosition: [20, 5],
			rotation: 3,
		},
		{
			...items.box,
			gridPosition: [10, 18],
			rotation: 3,
		},
		{
			...items.closet,
			gridPosition: [14, 0],
			rotation: 2,
		},
		{
			...items.bed,
			gridPosition: [17, 0],
			rotation: 2,
		},
		{
			...items.wall,
			gridPosition: [9, 22],
			rotation: 1,
		},
		{
			...items.wall,
			gridPosition: [9, 14],
			rotation: 1,
		},
		{
			...items.wall,
			gridPosition: [9, 0],
			rotation: 1,
		},
	],
};

const grid = new pathfinding.Grid(
	map.size[0] * map.gridDivision,
	map.size[1] * map.gridDivision
);

const finder = new pathfinding.AStarFinder({
	allowDiagonal: true,
	dontCrossCorners: true,
});

const findPath = (start, end) => {
	const gridClone = grid.clone();
	const path = finder.findPath(start[0], start[1], end[0], end[1], gridClone);
	return path;
};

const updateGrid = () => {
	map.items.forEach((item) => {
		if (item.walkable || item.wall) {
			return;
		}
		const width =
			item.rotation === 1 || item.rotation === 3 ? item.size[1] : item.size[0];
		const height =
			item.rotation === 1 || item.rotation === 3 ? item.size[0] : item.size[1];
		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				grid.setWalkableAt(
					item.gridPosition[0] + x,
					item.gridPosition[1] + y,
					false
				);
			}
		}
	});
};

updateGrid();

const generateRandomPosition = () => {
	for (let i = 0; i < 100; i++) {
		const x = Math.floor(Math.random() * map.size[0] * map.gridDivision);
		const y = Math.floor(Math.random() * map.size[1] * map.gridDivision);
		if (grid.isWalkableAt(x, y)) {
			return [x, y];
		}
	}
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
		nickname: "",
	});

	// console.log(characters);

	io.emit("characters", characters);

	socket.emit("hello", { map, characters, id: socket.id, items });

	socket.on("move", (from, to) => {
		const character = characters.find(
			(character) => character.id === socket.id
		);
		const path = findPath(from, to);
		if (!path) {
			return;
		}

		// console.log(character.position);

		character.position = to;

		// console.log(character.position);

		character.path = path;
		io.emit("playerMove", character);
	});

	socket.on("moveDone", (value) => {
		characters.forEach((character) => {
			if (character.id === value.id) {
				character.path = null;
			}
		});
	});

	// socket.on("disconnect", (socket) => {
	// 	console.log("user disconnected :", socket.id);

	// 	characters.splice(
	// 		characters.findIndex((character) => character.id === socket.id),
	// 		1
	// 	);
	// 	io.emit("characters", characters);
	// });

	socket.on("disconnect", () => {
		console.log("user disconnected :", socket.id);

		const index = characters.findIndex(
			(character) => character.id === socket.id
		);
		if (index !== -1) {
			characters.splice(index, 1);
		}
		io.emit("characters", characters);
	});

	socket.on("init", (soc) => {
		console.log(soc);
		characters.forEach((character) => {
			if (character.id === soc.id) {
				character.nickname = soc.nickname;
			}
		});
		io.emit("characters", characters);
		socket.emit("hello2", { nickname: soc.nickname });
	});
});
