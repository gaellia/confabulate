var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cookieParser = require('cookie-parser');

let currentUsers = {};
let history = [];

app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

app.get('/', function(req, res) { 
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket) {

    console.log('a user has connected');

    // generate random names and colors
    let randomName = nameGenerator();
    let randomColor = colorGenerator();
    while (randomName in currentUsers) {
        randomName = nameGenerator();
    }

    // emit current users to just the connector
    socket.emit('current users', {users: currentUsers, history: history, name: randomName, color: randomColor});

    // check the cookies
    if (socket.handshake.headers.cookie) {
        // it exists, so take the name and color
        let val = socket.request.headers.cookie.replace(/(?:(?:^|.*;\s*)name\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        let val2 = socket.request.headers.cookie.replace(/(?:(?:^|.*;\s*)color\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        randomName = val;
        randomColor = val2;
    }

    currentUsers[randomName] = randomColor;
    socket.userName = randomName;

    let message = "<span style='color:" + randomColor + "'>" + randomName + "</span>";

    io.emit('new user', message);

    socket.on('disconnect', function() {
        console.log('a user has disconnected');
        delete currentUsers[socket.userName];
        io.emit('goodbye user', {name: socket.userName});
    });

    socket.on('chat message', function(data) {
        // check for change commands
        if (data.msg[0] === "/") {
            let words = data.msg.split(" ");
            let answer = "";

            // nickname change
            if (words[0] === "/nick" && words.length === 2) {

                if (words[1] in currentUsers) {
                    answer = "That name is already taken.";
                } else {
                    let tmp = currentUsers[data.name];
                    currentUsers[words[1]] = tmp;
                    delete currentUsers[data.name];
                    answer = "Nickname changed.";
                    socket.userName = words[1];
                    io.emit('update', {oldName: data.name, newName: words[1], color: tmp});
                }
            // color change
            } else if (words[0] === "/nickcolor" && words.length === 2) {
                if (isNaN(parseInt(words[1],16))) {
                    answer = "Please specify in the format RRGGBB."
                } else {
                    currentUsers[data.name] = "#" + words[1];
                    answer = "Nickname color changed.";
                    io.emit('update', {oldName: data.name, newName: data.name, color: currentUsers[data.name]});
                }
            } else {
                answer = "Unknown command.";
            }
            socket.emit('chat message', "[Server] " + answer);
        } else {
            let time = new Date().getHours() + ":" + new Date().getMinutes();

            // constructing the message
            let message = time + " | " + "<span style='color:" + data.color + "'>"
                        + data.name + "</span>: " + data.msg;
            history.push(message);

            // only store the last 200 messages
            if (history.length > 200) {
                history.shift();
            }
            io.emit('chat message', message);
        }
    });
});

http.listen(3000, function() {
    console.log('listening on port 3000');
});

function nameGenerator() {
    let animals = ["alligator", "anteater", "armadillo", "auroch", "axolotl", "badger", "bat", "bear", "beaver", "blobfish", "buffalo", "camel", "chameleon", "cheetah", "chipmunk", "chinchilla", "chupacabra", "cormorant", "coyote", "crow", 
                "dingo", "dinosaur", "dog", "dolphin", "dragon", "duck", "dumbo octopus", "elephant", "ferret", "fox", "frog", "giraffe", "goose", "gopher", "grizzly", "hamster", "hedgehog", "hippo", "hyena", "jackal", "jackalope", "ibex", 
                "ifrit", "iguana", "kangaroo", "kiwi", "koala", "kraken", "lemur", "leopard", "liger", "lion", "llama", "manatee", "mink", "monkey", "moose", "narwhal", "nyan cat", "orangutan", "otter", "panda", "penguin", "platypus", "python", 
                "pumpkin", "quagga", "quokka", "rabbit", "raccoon", "rhino", "sheep", "shrew", "skunk", "slow loris", "squirrel", "tiger", "turtle", "unicorn", "walrus", "wolf", "wolverine", "wombat"];
    
    let rand = animals[Math.floor(Math.random() * animals.length)] + getRandomInt(200);
    return rand;
}

function colorGenerator() {
    let r = getRandomInt(255);
    let g = getRandomInt(255);
    let b = getRandomInt(255);

    let rand = "rgb(" + r + "," + g + "," + b + ")";
    return rand;
}

// generates a random int from 0 to max
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}