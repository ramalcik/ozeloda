const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json'); 

module.exports = {
  name: 'ozelodamenu',
  description: 'Özel oda işlemleri için menü gösterir.',
  execute(message, args, client) {
    if (!config.owners.includes(message.author.id)) {
      return message.channel.send('Bu komutu kullanmaya yetkiniz yok.');
    }

    const embed = new EmbedBuilder()
      .setTitle('✨ Özel Oda Yönetim Menüsü ✨')
      .setDescription(
        'Aşağıdaki seçeneklerden birini seçerek özel odanız ile ilgili işlemleri gerçekleştirebilirsiniz.\n\n' +
        '• **Özel Oda Kur:** Yeni bir özel oda oluşturur.\n' +
        '• **Özel Oda Kaldır:** Mevcut özel odayı kaldırır.'
      )
      .setColor(0x00AE86)
      .setFooter({ text: 'İşleminizi seçip, yönergeleri takip ediniz.' });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ozeloda-menu')
      .setPlaceholder('Bir seçenek belirleyin...')
      .addOptions([
        {
          label: 'Özel Oda Kur',
          description: 'Yeni bir özel oda oluşturur.',
          value: 'kur'
        },
        {
          label: 'Özel Oda Kaldır',
          description: 'Mevcut özel odayı kaldırır.',
          value: 'kaldir'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    message.channel.send({ embeds: [embed], components: [row] });
  }
};
