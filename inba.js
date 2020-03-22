const {client, clientEmiter} = require(`./my_modules/discordClient.js`);
const botConfig = require(`./config/config.json`);
const commands = require(`./my_modules/commands.js`);
const messageLogs = require(`./my_modules/messageLogs.js`);
const colors = require('colors');

client.commands = commands.loadModules(`./commands`);

client.once(`ready`, () => {
    client.user.setActivity(`Type !mi help`);
    console.log(`Inba powstał! - ${client.guilds.cache.size} serwerów 🖥`.gray);
    client.guilds.cache.forEach(g => {console.log(g.name.gray)});
});

client.on(`message`, msg => {
    if (msg.author.id == client.user.id) return;

    console.log(`•`.brightGreen, `${msg.member.displayName}`.cyan, `in`.grey, `${msg.guild.name}`.cyan, `at`.grey, `#${msg.channel.name}:`.cyan, `${msg.content}`);
    
    if (!msg.content.startsWith(botConfig.prefix)) return;
    if (msg.content == botConfig.prefix) return;//sd.send(message, op.random(`ping`));
    
    let prefixRegEx = new RegExp(`^${botConfig.prefix} `, `g`);
    if (!msg.content.match(prefixRegEx)) return;

    let quotePatt = new RegExp(/(?: "([^"\n]+)")|(?: ([^"\n ]+))/g);
    let args = [];
    let result;
    while (result = quotePatt.exec(` ${msg.content.slice(botConfig.prefix.length + 1)}`)) {
        args.push(result[1] ? result[1] : result[2]);
    }

    const command = client.commands.get(args[0].toLowerCase()) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0].toLowerCase()));
    if (command) command.execute(msg, args);
    else {
        //sd.send(message, `nada`);
        //TODO
    }
});

client.on(`messageDelete`, message => {
    messageLogs.onDelete(message);
});

client.on(`guildMemberAdd`, member => {
	clientEmiter.emit(`memberJoined`, member);
});

client.on(`guildMemberRemove`, member => {
    clientEmiter.emit(`memberLeft`, member);
});

client.on('raw', packet => {
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
    const channel = client.channels.get(packet.d.channel_id);
    if (channel.messages.has(packet.d.message_id)) return;
    channel.fetchMessage(packet.d.message_id).then(message => {
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
        const reaction = message.reactions.get(emoji);
        if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
        }
        if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            client.emit('messageReactionRemove', reaction, client.users.get(packet.d.user_id));
        }
    });
}); //https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/raw-events.md <3

client.login(botConfig.token);