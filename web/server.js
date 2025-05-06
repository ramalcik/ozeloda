const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const config = require('../config.json');
const { Client, GatewayIntentBits } = require('discord.js');


const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});


mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });


app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());


const Room = require('../models/Oda');


discordClient.login(config.token);


app.get('/', async (req, res) => {
    try {
        const rooms = await Room.find({});
        const enrichedRooms = await Promise.all(rooms.map(async (room) => {
            const guild = discordClient.guilds.cache.first();
            if (!guild) return room;

            
            const owner = await guild.members.fetch(room.ownerId).catch(() => null);
            const voiceChannel = guild.channels.cache.get(room.voiceChannelId);
            
            
            const allowedUsers = await Promise.all(room.allowedUsers.map(async (userId) => {
                const member = await guild.members.fetch(userId).catch(() => null);
                return member ? {
                    id: member.id,
                    username: member.user.username,
                    avatar: member.user.avatar
                } : null;
            }));

            return {
                ...room.toObject(),
                ownerName: owner ? owner.user.username : 'Bilinmeyen Kullanıcı',
                ownerAvatar: owner ? owner.user.avatar : null,
                voiceChannelName: voiceChannel ? voiceChannel.name : 'Bilinmeyen Kanal',
                memberCount: voiceChannel ? voiceChannel.members.size : 0,
                userLimit: voiceChannel ? voiceChannel.userLimit : null,
                allowedUsers: allowedUsers.filter(user => user !== null)
            };
        }));

        res.render('index', { rooms: enrichedRooms });
    } catch (error) {
        console.error('Odalar getirilirken hata:', error);
        res.status(500).send('Odalar getirilirken hata oluştu');
    }
});


app.post('/api/rooms/:roomId/delete', async (req, res) => {
    try {
        const room = await Room.findOne({ voiceChannelId: req.params.roomId });
        if (!room) {
            return res.status(404).json({ error: 'Oda bulunamadı' });
        }

        
        io.emit('deleteRoom', { roomId: req.params.roomId });

        res.json({ success: true });
    } catch (error) {
        console.error('Oda silinirken hata:', error);
        res.status(500).json({ error: 'Oda silinirken hata oluştu' });
    }
});


io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı');

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı');
    });
});


http.listen(config.webPort, () => {
    console.log(`Web sunucusu ${config.webPort} portunda çalışıyor`);
}); 