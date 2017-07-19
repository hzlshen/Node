var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));


app.get('/', function (req, res) {
    res.sendfile('index.html');
});

var connectedSockets={};
var allUsers=[{nickname:"",color:"#000"}];//初始值即包含"群聊",用""表示nickname
io.on('connection',function(socket){


    socket.on('addUser',function(data){ //有新用户进入聊天室
        if(connectedSockets[data.nickname]){//昵称已被占用
          socket.emit('userAddingResult',{result:false});
        }else{
            socket.emit('userAddingResult',{result:true});
            socket.nickname=data.nickname;
            connectedSockets[socket.nickname]=socket;//保存每个socket实例,发私信需要用
            allUsers.push(data);
            socket.broadcast.emit('userAdded',data);//广播欢迎新用户,除新用户外都可看到
            socket.emit('allUser',allUsers);//将所有在线用户发给新用户
        }

    });

    socket.on('addMessage',function(data){ //有用户发送新消息
        if(data.to){//发给特定用户
            connectedSockets[data.to].emit('messageAdded',data);
        }else{//群发
            socket.broadcast.emit('messageAdded',data);//广播消息,除原发送者外都可看到
        }


    });



    socket.on('disconnect', function () {  //有用户退出聊天室
            socket.broadcast.emit('userRemoved', {  //广播有用户退出
                nickname: socket.nickname
            });
            for(var i=0;i<allUsers.length;i++){
                if(allUsers[i].nickname==socket.nickname){
                    allUsers.splice(i,1);
                }
            }
            delete connectedSockets[socket.nickname]; //删除对应的socket实例

        }
    );
});

http.listen(3002, function () {
    console.log('listening on *:3002');
});