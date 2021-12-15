//Citation used a lot- http://psitsmike.com/2011/10/node-js-and-socket-io-multiroom-chat-tutorial/
//Citation - https://www.w3schools.com/howto/howto_css_chat.asp
//Citation - https://stackoverflow.com/questions/8888491/how-do-you-display-javascript-datetime-in-12-hour-am-pm-format

// Require the packages we will use:
const http = require("http"),
    fs = require("fs");
const socketio = require("socket.io")(http, {
		wsEngine: 'ws'
	});
const url = require("url");
const path = require("path");
const { exit } = require("process");
// const { exit } = require("node:process");
// const exit = require("node:process");
var filename = ""; 
var filepath = "";
const port = 3456;
// package url;
const file = "client.html";

const server = http.createServer(function (req, res) {
    filename = url.parse(req.url).pathname;
    if (filename == "/")
    {
        filename = "/client.html";
    }
    filepath = path.join(__dirname,filename);
    // console.log(filepath);
    fs.readFile(filepath, function (err, data) {
        if (err) return res.writeHead(500);
        res.writeHead(200);
        res.end(data);
    });
});
server.listen(port);

function user(username, id)
{
    this.username = username;
    this.id = id;
}
function message(id, roomid, sentby, text)
{
    this.id = id;
    this.roomid = roomid;
    this.sentby = sentby;
    this.text = text;
}
function chatroom(roomname, roomid, madeby, password)
{
    this.roomname = roomname;
    this.roomid = roomid;
    this.madeby = madeby;
    this.password = password; 

    this.messages = [];
    this.members = [];
    this.bannedmembers = [];
    
}

// const socketio = require("socket.io")(server);
const io = socketio.listen(server);
var socketId = {};
var current = "";
var rooms = [{'roomName':'Main Room'},{'roomName':'Room B'}];
var users=[];
// var usernamee = "";

io.sockets.on("connection", function(socket){
	// console.log(users);
    // var username = "Annonymous User";

    //  - Make sure user does not already exists
    // - Join the user to the 'main' room
    // - respond with a welcome or deny message
    // - respond with the list of chat rooms
	socket.on('addUser', function(username){
		if (username == null || username == undefined || username == "undefined" || username == "NULL")
		{
            socket.emit("errorMessage", "Username invalid! Try again!");
			return;
		}

		if (users.length == 0)
		{
				socket.user = username;
					socketId[username] = socket.id;
				        socket.room = 'Main Room';
						socket.join('Main Room');
					
                        users.push(socket);
						socket.emit("roomAdd", rooms, rooms[0]);
		
						socket.broadcast.to('Main Room').emit('updateConvo', username + ' has connected to this room');
						socket.emit('updateRoom', rooms, 'Main Room');
                        printUsers(users, 'Main Room')
			return;
		}
		
		if (users.length != 0)
		{
            for(var y = 0 ;y<users.length; y++){
               
                if (username === users[y].user) {
                    socket.emit("errorMessage", "Enter different username! That one is taken! Refresh page! ");
                    return
                }
            }
			
		}
	
				socket.user = username;
                socketId[username] = socket.id;

				socket.room = 'Main Room';
                socket.join('Main Room');
                users.push(socket);
                socket.emit("roomAdd", rooms, rooms[0]);

                socket.broadcast.to('Main Room').emit('updateConvo', username + ' has connected to this room');
                socket.emit('updateRoom', rooms, 'Main Room');

        printUsers(users, socket.room);

	});
	//move around function to make it easier
	function movearound(socket, justMoved)
	{
		socket.broadcast.to(socket.room).emit('updateConvo', socket.user + ' just left this room');
        socket.leave(socket.room)

		socket.room = justMoved;
        socket.join(justMoved)
		socket.broadcast.to(justMoved).emit('updateConvo', socket.user + ' just joined this room');
		socket.emit('updateRoom', rooms, justMoved);
			
	
	}
	
    // - check to make sure a room with that name does not exists
    // - create the room
    // - make socket leave current room
    // - make socket join new room
	socket.on("roomAdd", function(roomAdd){
        for(var x = 0 ;x<rooms.length; x++){
			
			console.log(rooms[x].roomName);
            if (roomAdd == rooms[x].roomName)
            {
                
				socket.emit("errorMessage", "ERROR: Room name already exits!");
                return;
            }
        }
		rooms.push({roomName:roomAdd, bannedUsers: [], owner: socket.user});
		// console.log(rooms);
		io.emit('roomAdd', rooms, socket.room);
	});
	
	socket.on("addWithPw", function(roomAdd, pw){
		rooms.push({roomName:roomAdd, password: pw});
		io.emit('roomAdd', rooms, socket.room);
	});
	
	socket.on("checkPw", function(justMoved, inputPW){
		for(var x = 0 ;x<rooms.length; x++){
			if(rooms[x].roomName == justMoved){
				if(rooms[x].password == inputPW){ //successful
					socket.join(justMoved);
					socket.emit('updateConvo', 'you have connected to room ' +justMoved);
					movearound(socket, justMoved);
					printUsers(users, socket.room);
				}
                else{
                    socket.emit('errorMessage', `Error! Incorrect Password! `);

                }
			}
		}
	});

    // <- Receive the "LEAVE_ROOM" message from client
    // - call socket.leave( <PUT_ROOM_NAME_HERE> ) on the client
    // - call socket.join('main')
	socket.on("switchRooms", function(justMoved){
        socket.emit('errorMessage', "");
        var test = false;
        console.log("pizza");
		for(var x=2; x<rooms.length; x++){
            console.log(rooms[x].roomName);
            console.log(justMoved);
			if(rooms[x].roomName == justMoved){
                console.log("SUCCESS");
                   
                    for (var y = 0; y<rooms[x].bannedUsers.length; y++)
                    {
                        console.log("2929292283838383");
                        console.log("rooms[x].bannedUsers[y]")
                        console.log(rooms[x].bannedUsers[y]);
                    
                    if (rooms[x].bannedUsers[y] == socket.user)
                    {
                        console.log("BANNNNNEEEDD");
                        socket.leave(socket.room);
		                socket.join(rooms[0]);
                       
                        return;
                    }
                    else{
                        socket.leave(socket.room);
                        socket.join(justMoved);
                    }

                
            }
            
			}}
     
        let oldRoom = socket.room;
		movearound(socket, justMoved);
		printUsers(users, socket.room);
        printUsers(users, oldRoom)
	});

   //prints what users are in each room
    function printUsers(users, currRoom)
	{	
		var stringofUsers = "";

		var arrayOfUsersInRoom = []
		for (var i = 0; i < users.length; ++i) {
            stringofUsers = currRoom + ": "
            if (users[i].room == currRoom)
            {
                arrayOfUsersInRoom.push(users[i].user)

            }
        }
   
        io.sockets.in(currRoom).emit("messagetoViewer", {listOfUsers: arrayOfUsersInRoom});

    }

    function usersConvo(users, currRoom)
    {
        var stringofUsers = "";

		var otherArray = []
		for (var i = 0; i < users.length; ++i) {
            stringofUsers = currRoom + ": "
            if (users[i].room == currRoom)
            {
                otherArray.push(users[i].user)

            }
        }
   
        socket.emit("updateConvo", "Welcome! Here are the users in room: [" + otherArray + "] We hope you make friends! (PS user lists are also visible to the left at any time)");
    }


    // <- Receive message from client to specific room "MESSAGE_TO_ROOM" action
    // - Get Id/room name of the room they are messaging
    // - Send "NEW_MESSAGE_FROM_ROOM" action

    socket.on('input', function(data, time) {
        if (data.message == "/help")
        {
            socket.emit("updateConvo", `Welcome to ${socket.room} ! To create a room, look to the left and once you make a room, you can kick people out or ban them if things go wrong!`);
        }
        else if (data.message == "/users")
        {
            usersConvo(users, socket.room);
            console.log("IEWNFOINIEWNFOINEWFINFOIENW");
        }
        else if (data.message == "/emojis")
        {
            socket.emit("updateConvo", "Type the following for the following emoji options to send: /happy = happy face, /sad = sad face, /mad = mad face, /heart = red heart");

        }
        else if (data.message == "/happy")
        {
            var emoji = String.fromCodePoint(0x1F600);
            socket.emit("emoji", emoji);
        }
        else if (data.message == "/sad")
        {
            var emoji = String.fromCodePoint(0x1F614);
            socket.emit("emoji", emoji);
        }
        else if (data.message == "/mad")
        {
            var emoji = String.fromCodePoint(0x1F621);
            socket.emit("emoji", emoji);
        }
        else if (data.message == "/heart")
        {
            var emoji = String.fromCodePoint(0x2764);
            socket.emit("emoji", emoji);
        }
        else
        {
            io.sockets.in(socket.room).emit("output", socket.user, {message:data.message}, time);
        }

	});

    //private messaging
	socket.on("privateMessage", function(to, messagetext){
		//private messages
        console.log(to);
		var from = socket.user;
        console.log("PRIVATE");
        for(var y=0; y<users.length; y++){
            console.log("TOOO");
            console.log(to);
            console.log(users[y].user)
            if (to == users[y].user)
            {
                if (users[y].room == socket.room)
                {

                
                console.log("888888");
                console.log(socketId[to]);
                socket.broadcast.to(socketId[to]).emit('private', from, messagetext);
                console.log("SUCCESS");
                }
            }
            else{
                users[y].emit('errorMessage', `Error! Either invalid user or user is not in current room!`);
                console.log("ERROR");
            }
        }

	});
	
// <- Receive "KICK_USER_FROM_ROOM" action
// - Verify that the socket requesting the kick is the admin of that room
// - find the specifc user in the list of users
// - socket.leave on that specifc socket
// - call socket.join('main') in the kicked socket
	socket.on("kickout", function(who){
        console.log("kickout method js");
        // console.log(who)
        for(var x=2; x<rooms.length; x++){
            console.log(socket.user, rooms[x].owner)
			if (String(socket.user).trim() == String(rooms[x].owner).trim())
			{
				for(var y=0; y<users.length; y++){
                   
					if (who == users[y].user)
					{
                        console.log("WHOO");
						users[y].room = 'Main Room';
                        users[y].leave(socket.room)
                        users[y].join('Main Room')
	
						users[y].emit("roomAdd", rooms, rooms[0]);
		
						users[y].emit('updateRoom', rooms, 'Main Room');
                        users[y].emit('errorMessage', `You have been kicked out of ${socket.room} and moved to the main room.`);
                        console.log("KICKED OUT");
                        printUsers(users, socket.room)
                        printUsers(users, 'Main Room')
					}
				}
			}
		}

        

	});
	//making private room 
	socket.on("privateRoom", function(privateRoom){
		for(var x=0; x<rooms.length; x++){
			if(rooms[x].roomName == privateRoom){
				if(rooms[x].hasOwnProperty('password')){
					socket.emit('askPW', privateRoom);
				}
			}
		}
	});
	
    // <- Receive "BAN_USER_FROM_ROOM" action from client
    // - Verify that the socket requesting the kick is the admin of that room
    // - find the specifc user in the list of users
    // - socket.leave on that specifc socket
    // - call socket.join('main') in the kicked socket
    // - Add the user's socketId/name to the banned users array for that room
    
	socket.on("ban", function(badperson, banner){
		for(var x=2; x<rooms.length; x++){
            console.log("RNGOIRNGIOERNGOINERGRERG");
            console.log(badperson);
            console.log(banner);
            console.log(rooms[x].owner);
            console.log("XX");
            console.log(String(socket.user).trim());
            console.log(String(rooms[x].owner).trim());
			if (String(socket.user).trim() == String(rooms[x].owner).trim())
			{
                
				for(var y=0; y<users.length; y++){
                    console.log("INSIDEEEE");
                    console.log(badperson);
                    console.log(users[y].user);
					if (badperson == users[y].user)
					{
						rooms[x].bannedUsers.push(badperson);
                        // users[y].emit("kickout", users[y]);
                                        console.log("WHOO");
                                        // socket.room = 'Main Room';
                                        users[y].room = 'Main Room';
                                        users[y].leave(socket.room)
                                        users[y].join('Main Room')
                    
                                        users[y].emit("roomAdd", rooms, rooms[0]);
                        
                                        users[y].emit('updateRoom', rooms, 'Main Room');
                                        users[y].emit('errorMessage', `You have been banned from ${socket.room} and moved to the main room. Sorry`);
                                        console.log("KICKED OUT");
                                        printUsers(users, socket.room)
                                        printUsers(users, 'Main Room')
                                        users[y].emit('switchRoom', rooms[0]);
                        
                
                        console.log(badperson);
					}
				}
                console.log(rooms[x].bannedUsers);

			}
		}

	});
	
	socket.on('disconnect', function(){
		//when you exi, disconnect
		if (socket.user != undefined)
		{ 
		socket.broadcast.emit('updateConvo', socket.user + ' has disconnected');
        let indexOfUser = users.indexOf(socket);
        let disconnectedUser = users.splice(indexOfUser, 1);
        printUsers(users, socket.room)
       

	}
	});

});