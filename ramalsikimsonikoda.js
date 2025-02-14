const {
  Client,
  GatewayIntentBits,
  Collection,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  StringSelectMenuBuilder
} = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const mongoose = require('mongoose');
const Room = require('./models/Oda');
const { joinVoiceChannel } = require('@discordjs/voice');

mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
console.log('MongoDB bağlantısı kuruldu.');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();
const komutDosyalari = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const dosya of komutDosyalari) {
  const komut = require(`./commands/${dosya}`);
  client.commands.set(komut.name, komut);
}

client.erkekrol = config.erkekrol;
client.kizrol = config.kizrol;
client.karantina = config.karantina;

client.ozelodaolusturChannelId = null;

client.once('ready', async () => {
  console.log(`${client.user.tag} hazır!`);

  client.user.setPresence({
    status: 'dnd',
    activities: [{ name: 'OZEL ODA BOTU SIKIMSONIK', type: 3 }]
});

const voiceChannel = client.channels.cache.get(config.BOTSESLA); 
if (voiceChannel) {
    joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false 
    });
    console.log("Bot ses kanalına katıldı!");
  }


  client.guilds.cache.forEach(guild => {
    const lobbyChannel = guild.channels.cache.find(
      ch => ch.type === ChannelType.GuildVoice && ch.name === 'ozelodaolustur'
    );
    if (lobbyChannel) {
      client.ozelodaolusturChannelId = lobbyChannel.id;
      console.log(`Ozel oda oluştur kanal yüklendi: ${lobbyChannel.id}`);
    }
  });

  const rooms = await Room.find({});
  for (const room of rooms) {
    const voiceChannel = client.channels.cache.get(room.voiceChannelId);
    if (voiceChannel) {
      if (voiceChannel.members.size === 0) {
        const textChannel = client.channels.cache.get(room.textChannelId);
        if (textChannel) await textChannel.delete();
        await voiceChannel.delete();
        await Room.deleteOne({ voiceChannelId: room.voiceChannelId });
        console.log(`Boş özel oda (${voiceChannel.name}) silindi.`);
      }
    } else {
      await Room.deleteOne({ voiceChannelId: room.voiceChannelId });
    }
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const komutIsmi = args.shift().toLowerCase();
  const komut = client.commands.get(komutIsmi);
  if (!komut) return;
  komut.execute(message, args, client);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  const guild = newState.guild || oldState.guild;
  
  if (
    newState.channelId &&
    client.ozelodaolusturChannelId &&
    newState.channelId === client.ozelodaolusturChannelId
  ) {
    const member = newState.member;

    let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === 'Özel Odalar');
    if (!category) {
      category = await guild.channels.create({
        name: 'Özel Odalar',
        type: ChannelType.GuildCategory
      });
    }
    const voiceChannel = await guild.channels.create({
      name: `Özel Oda - ${member.user.username}`,
      type: ChannelType.GuildVoice,
      parent: category.id,
      permissionOverwrites: [
        { id: guild.id, deny: ['Connect'] },
        { id: member.id, allow: ['Connect', 'ManageChannels'] },
        { id: config.karantina, deny: ['Connect'] },
        { id: config.erkekrol, allow: ['Connect'] },
        { id: config.kizrol, allow: ['Connect'] }
      ]
    });

    const textChannel = await guild.channels.create({
      name: `oda-panel-${member.user.username}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        { id: guild.id, deny: ['ViewChannel'] },
        { id: member.id, allow: ['ViewChannel'] },
        { id: config.karantina, deny: ['ViewChannel'] },
        { id: config.erkekrol, allow: ['ViewChannel'] },
        { id: config.kizrol, allow: ['ViewChannel'] }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle('Özel Oda Oluşturuldu')
      .setDescription(
        `**Odanız:** ${voiceChannel.name}\n\n` +
        `Yapabileceğiniz İşlemler:\n` +
        `• **Oda İsmi Değiştir**\n` +
        `• **Oda Limiti Ayarla**\n` +
        `• **Odadan At**\n` +
        `• **Kullanıcı Ekle**\n` +
        `• **Kullanıcı Çıkar**\n` +
        `• **Herkese Aç**\n` +
        `• **Herkese Kapat**`
      );

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rename-${voiceChannel.id}`)
        .setLabel('Oda İsmi Değiştir')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("1330231395385212949"),
      new ButtonBuilder()
        .setCustomId(`limit-${voiceChannel.id}`)
        .setLabel('Oda Limiti Ayarla')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("1330231395385212949"),
      new ButtonBuilder()
        .setCustomId(`odadanat-${voiceChannel.id}`)
        .setLabel('Odadan At')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("1330231395385212949")
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ekle-${voiceChannel.id}`)
        .setLabel('Kullanıcı Ekle')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("1330231395385212949"),
      new ButtonBuilder()
        .setCustomId(`cikar-${voiceChannel.id}`)
        .setLabel('Kullanıcı Çıkar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("1330231395385212949"),
      new ButtonBuilder()
        .setCustomId(`herkeseac-${voiceChannel.id}`)
        .setLabel('Herkese Aç')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("1330231395385212949"),
      new ButtonBuilder()
        .setCustomId(`herkesekapat-${voiceChannel.id}`)
        .setLabel('Herkese Kapat')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("1330231395385212949")
    );

    await textChannel.send({ embeds: [embed], components: [row1, row2] });

    await new Room({
      ownerId: member.id,
      voiceChannelId: voiceChannel.id,
      textChannelId: textChannel.id,
      allowedUsers: []
    }).save();

    await member.voice.setChannel(voiceChannel);

    setTimeout(async () => {
      const ch = guild.channels.cache.get(voiceChannel.id);
      if (ch && ch.members.size === 0) {
        const dbRoom = await Room.findOne({ voiceChannelId: voiceChannel.id });
        if (dbRoom) {
          const panel = guild.channels.cache.get(dbRoom.textChannelId);
          if (panel) await panel.delete();
          await voiceChannel.delete();
          await Room.deleteOne({ voiceChannelId: voiceChannel.id });
        }
      }
    }, 180000);
  }

  if (newState.channelId) {
    const room = await Room.findOne({ voiceChannelId: newState.channelId });
    if (room) {
      if (
        newState.member.user.id !== room.ownerId &&
        !room.allowedUsers.includes(newState.member.user.id)
      ) {
        await newState.setChannel(null);
        console.log(`${newState.member.user.tag} izinsiz girdiği için atıldı.`);
      }
    }
  }

  if (oldState.channelId) {
    const room = await Room.findOne({ voiceChannelId: oldState.channelId });
    if (room) {
      const ch = oldState.channel;
      if (ch.members.size === 0) {
        const panel = oldState.guild.channels.cache.get(room.textChannelId);
        if (panel) await panel.delete();
        await ch.delete();
        await Room.deleteOne({ voiceChannelId: oldState.channelId });
      }
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'ozeloda-menu') {
      const choice = interaction.values[0]; 
      const guild = interaction.guild;
      
      let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === 'Özel Odalar');
      if (!category) {
        category = await guild.channels.create({
          name: 'Özel Odalar',
          type: ChannelType.GuildCategory
        });
      }
      
      if (choice === 'kur') {
        let lobbyChannel = guild.channels.cache.find(ch => ch.name === 'ozelodaolustur' && ch.type === ChannelType.GuildVoice);
        if (!lobbyChannel) {
          lobbyChannel = await guild.channels.create({
            name: 'ozelodaolustur',
            type: ChannelType.GuildVoice,
            parent: category.id,
            userLimit: 1,
            permissionOverwrites: [
              { id: guild.id, allow: ['Connect'] }
            ]
          });
          client.ozelodaolusturChannelId = lobbyChannel.id;
          await interaction.reply({ content: '`ozelodaolustur` ses kanalı oluşturuldu.', ephemeral: true });
        } else {
          client.ozelodaolusturChannelId = lobbyChannel.id;
          await interaction.reply({ content: '`ozelodaolustur` ses kanalı zaten mevcut.', ephemeral: true });
        }
      } else if (choice === 'kaldir') {
        let lobbyChannel = guild.channels.cache.find(ch => ch.name === 'ozelodaolustur' && ch.type === ChannelType.GuildVoice);
        if (lobbyChannel) {
          await lobbyChannel.delete();
          client.ozelodaolusturChannelId = null;
          await interaction.reply({ content: '`ozelodaolustur` ses kanalı kaldırıldı.', ephemeral: true });
        } else {
          await interaction.reply({ content: '`ozelodaolustur` ses kanalı bulunamadı.', ephemeral: true });
        }
      }
      return;
    }
  }
  
  if (interaction.isButton()) {
    const [action, voiceChannelId] = interaction.customId.split('-');
    const room = await Room.findOne({ voiceChannelId });
    if (!room)
      return interaction.reply({ content: 'Oda bulunamadı.', ephemeral: true });
    if (interaction.user.id !== room.ownerId)
      return interaction.reply({ content: 'Bu işlemi yalnızca oda sahibi yapabilir.', ephemeral: true });
    const guild = interaction.guild;
    const voiceChannel = guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel)
      return interaction.reply({ content: 'Ses kanalı bulunamadı.', ephemeral: true });
  
    if (action === 'rename') {
      const modal = new ModalBuilder()
        .setCustomId(`rename-modal-${voiceChannelId}`)
        .setTitle('Oda İsmi Değiştir');
      const input = new TextInputBuilder()
        .setCustomId('newRoomName')
        .setLabel('Yeni Oda İsmi')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);
      return interaction.showModal(modal);
    } else if (action === 'limit') {
      const modal = new ModalBuilder()
        .setCustomId(`limit-modal-${voiceChannelId}`)
        .setTitle('Oda Limiti Ayarla');
      const input = new TextInputBuilder()
        .setCustomId('newLimit')
        .setLabel('Yeni Limit (sayı)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);
      return interaction.showModal(modal);
    } else if (action === 'ekle') {
      const modal = new ModalBuilder()
        .setCustomId(`ekle-modal-${voiceChannelId}`)
        .setTitle('Kullanıcı Ekle');
      const input = new TextInputBuilder()
        .setCustomId('addUser')
        .setLabel('Eklenecek Kullanıcının ID veya @etiketi')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);
      return interaction.showModal(modal);
    } else if (action === 'cikar') {
      const modal = new ModalBuilder()
        .setCustomId(`cikar-modal-${voiceChannelId}`)
        .setTitle('Kullanıcı Çıkar');
      const input = new TextInputBuilder()
        .setCustomId('removeUser')
        .setLabel('Çıkarılacak Kullanıcının ID veya @etiketi')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);
      return interaction.showModal(modal);
    } else if (action === 'odadanat') {
      const modal = new ModalBuilder()
        .setCustomId(`odadanat-modal-${voiceChannelId}`)
        .setTitle('Odadan At');
      const input = new TextInputBuilder()
        .setCustomId('kickUser')
        .setLabel('Atılacak Kullanıcının ID veya @etiketi')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);
      return interaction.showModal(modal);
    } else if (action === 'herkeseac') {
      await voiceChannel.permissionOverwrites.edit(guild.id, { Connect: true });
      return interaction.reply({ content: 'Oda herkese açıldı.', ephemeral: true });
    } else if (action === 'herkesekapat') {
      await voiceChannel.permissionOverwrites.edit(guild.id, { Connect: false });
      return interaction.reply({ content: 'Oda herkese kapatıldı.', ephemeral: true });
    }
  }
  
  if (interaction.isModalSubmit()) {
    const customIdParts = interaction.customId.split('-'); 
    const action = customIdParts[0];
    const modalType = customIdParts[1]; 
    const voiceChannelId = customIdParts[2];
    const room = await Room.findOne({ voiceChannelId });
    if (!room)
      return interaction.reply({ content: 'Oda bulunamadı.', ephemeral: true });
    const guild = interaction.guild;
    const voiceChannel = guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel)
      return interaction.reply({ content: 'Ses kanalı bulunamadı.', ephemeral: true });
  
    if (modalType === 'modal') {
      if (action === 'rename') {
        const newName = interaction.fields.getTextInputValue('newRoomName');
        await voiceChannel.setName(newName);
        return interaction.reply({ content: `Oda ismi \`${newName}\` olarak güncellendi.`, ephemeral: true });
      } else if (action === 'limit') {
        const newLimitStr = interaction.fields.getTextInputValue('newLimit');
        const newLimit = parseInt(newLimitStr);
        if (isNaN(newLimit))
          return interaction.reply({ content: 'Lütfen geçerli bir sayı girin.', ephemeral: true });
        await voiceChannel.setUserLimit(newLimit);
        return interaction.reply({ content: `Oda limiti \`${newLimit}\` olarak ayarlandı.`, ephemeral: true });
      } else if (action === 'ekle') {
        const userInput = interaction.fields.getTextInputValue('addUser');
        const userId = userInput.replace(/[<@!>]/g, '');
        const member = guild.members.cache.get(userId);
        if (!member)
          return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
        await voiceChannel.permissionOverwrites.edit(member.id, { Connect: true });
        await Room.findOneAndUpdate({ voiceChannelId }, { $addToSet: { allowedUsers: userId } });
        return interaction.reply({ content: `${member.user.username} artık odaya katılabilir.`, ephemeral: true });
      } else if (action === 'cikar') {
        const userInput = interaction.fields.getTextInputValue('removeUser');
        const userId = userInput.replace(/[<@!>]/g, '');
        const member = guild.members.cache.get(userId);
        if (!member)
          return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
        await voiceChannel.permissionOverwrites.delete(member.id);
        await Room.findOneAndUpdate({ voiceChannelId }, { $pull: { allowedUsers: userId } });
        return interaction.reply({ content: `${member.user.username} artık odaya katılamaz.`, ephemeral: true });
      } else if (action === 'odadanat') {
        const userInput = interaction.fields.getTextInputValue('kickUser');
        const userId = userInput.replace(/[<@!>]/g, '');
        const member = guild.members.cache.get(userId);
        if (!member)
          return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
        if (member.voice.channel && member.voice.channel.id === voiceChannelId) {
          await member.voice.disconnect();
          return interaction.reply({ content: `${member.user.username} odadan atıldı.`, ephemeral: true });
        } else {
          return interaction.reply({ content: 'Belirtilen kullanıcı odada değil.', ephemeral: true });
        }
      } else {
        return interaction.reply({ content: 'Bilinmeyen işlem.', ephemeral: true });
      }
    }
  }
});

client.login(config.token);
