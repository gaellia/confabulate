let userName = "default"
let userColor = "#70163C"

$(function () {
    var socket = io();
    $('form').submit(function(e) {
        e.preventDefault(); // prevent page from refreshing
        socket.emit('chat message', {msg: $('#m').val(), name: userName, color: userColor});
        $('#m').val('');
        return false;
    });

    socket.on('chat message', function(msg) {
        $('#messages').append($('<li>').html(msg));
        $('.messages-body').scrollTop($('.messages-body')[0].scrollHeight);

        // bold the user's messages
        $('#messages').find("li:contains(" + userName + ")").css("font-weight", "Bold");
    });

    socket.on('new user', function(msg) {
        $('#users').append($('<li>').html(msg));
        $('.users-body').scrollTop($('.users-body')[0].scrollHeight);
    });

    socket.on('current users', function(data) {
        // check for cookies
        if (document.cookie.split(';').filter(function(item) {
            return item.trim().indexOf('name=') == 0 }).length ) {
            // it exists, so update user name
            let val = document.cookie.replace(/(?:(?:^|.*;\s*)name\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            let val2 = document.cookie.replace(/(?:(?:^|.*;\s*)color\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            userName = val;
            userColor = val2;
        } else {
            // doesn't exist, so create one
            document.cookie = "name="+data.name;
            document.cookie = "color="+data.color;
            userName = data.name;
            userColor = data.color;
        }
        let inner = "<span style='color:" + userColor + "'>" + userName + "</span>";
        $('#name').html(inner);

        for (let key in data.users) {
            let color = data.users[key];
            let inner = "<span style='color:" + color + "'>" + key + "</span>";
            $('#users').append($('<li>').html(inner));
        }
        for (let i in data.history) {
            $('#messages').append($('<li>').html(data.history[i]));
            // bold the user's messages
            $('#messages').find("li:contains(" + userName + ")").css("font-weight", "Bold");
        }
    });

    socket.on('goodbye user', function(data) {
        $('#users').find("li:contains(" + data.name + ")").remove();
    });

    socket.on('update', function(data) {
        let inner = "<span style='color:" + data.color + "'>" + data.newName + "</span>";
        $('#users').find("li:contains(" + data.oldName + ")").html(inner);
        if (userName === data.oldName) {
            userName = data.newName;
            userColor = data.color;
            $('#name').html(inner);
        }
    });
});