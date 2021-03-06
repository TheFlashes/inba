const {client, clientEmiter} = require(`../my_modules/discordClient.js`);
const CommandTemplate = require(`../my_modules/CommandTemplate.js`);
const botConfig = require(`../config/config.json`);
const {db} = require(`../my_modules/database.js`);

class WelcomeMsg extends CommandTemplate {
    constructor(msg, args) {
        super(msg, args);
        this.type = ((this.args[0].toLowerCase() == `welcomemessage` || this.args[0].toLowerCase() == `wm`) ? 0 : 1);

        if (this.args.length < 2) return this.help();

        this.action = this.args[1].toLowerCase();
        if (this.action == `add`) this.addMsg();
        else if (this.action == `list`) this.list();
        else if (this.action == `remove`) this.remove();
        else if (this.action == `test`) this.test();
        else if (this.action == `help`) this.help();
        else this.sendEmbed(0, this.getString(`typical`, `unknownCommand`, [args[0]]));
    }
    async addMsg() {
        if (!this.checkPermission(this.msg)) return;
        if (this.args.length < 3) 
            return this.sendEmbed(0, this.getString(`wellFarMessage`, `add`, `error`, `blankMsg`));

        let count = await db.query("SELECT COUNT(*) AS msgCount FROM `welcomeMsgs` WHERE `serverFK` = ? AND `msgType` = ?", [this.msg.guild.id, this.type]);
        if (count[0].msgCount > 9) 
            return this.sendEmbed(0, this.getString(`wellFarMessage`, `add`, `error`, `tooManyMsgs`));

        this.args.splice(0, 2);
        let message = this.args.join(` `).replace(/\n/g, ` `);
        if (message.search(`%u`) == -1) this.sendEmbed(2, this.getString(`wellFarMessage`, `add`, `warning`, `memberNotMontioned`));

        let result = await db.query("INSERT INTO `welcomeMsgs` (msgID, serverFK, msgType, content) VALUES (NULL, ?, ?, ?)", [this.msg.guild.id, this.type, message]);
        if (result) this.sendEmbed(1, this.getString(`wellFarMessage`, `add`, `success`, `${this.type}`, [message.replace(/`/g, ``)]));
    }
    async list() {
        let result = await db.query("SELECT `content` FROM `welcomeMsgs` WHERE `serverFK` = ? AND `msgType` = ?", [this.msg.guild.id, this.type]);
        if (result.length > 0) {
            let listMsg = `\`\`\`\n`;
            result.forEach((row, rowIndex) => {
                listMsg += `${rowIndex + 1}. ${row.content}\n`;
            });
            listMsg += `\`\`\``;
            this.send(this.getString(`wellFarMessage`, `list`, `result`, `${this.type}`) + `\n` + listMsg);
        } else {
            this.send(this.getString(`wellFarMessage`, `list`, `noMessages`, `${this.type}`));
        }
    }
    async remove() {
        if (!this.checkPermission(this.msg)) return;
        if (this.args.length < 3)
            return this.sendEmbed(0, this.getString(`wellFarMessage`, `remove`, `error`, `noMsgID`));

        if (isNaN(this.args[2]))
            return this.sendEmbed(0, this.getString(`wellFarMessage`, `remove`, `error`, `notValidID`));

        if (parseInt(this.args[2]) < 1)
            return this.sendEmbed(0, this.getString(`wellFarMessage`, `remove`, `error`, `notValidID`));

        let result = await db.query("DELETE FROM `welcomeMsgs` WHERE `msgID` = (SELECT `msgID` FROM `welcomeMsgs` WHERE `serverFK` = ? AND `msgType` = ? LIMIT ?, 1)", [this.msg.guild.id, this.type, parseInt(this.args[2] - 1)]);
        if (result.affectedRows == 1) this.sendEmbed(1, this.getString(`wellFarMessage`, `remove`, `success`));
        else this.sendEmbed(0, this.getString(`wellFarMessage`, `remove`, `error`, `notFound`));
    }
    async test() {
        if (!this.checkPermission(this.msg)) return;
        let result = await db.query("SELECT `content` FROM `welcomeMsgs` WHERE `serverFK` = ? AND `msgType` = ?", [this.msg.guild.id, this.type]);
        if (result.length < 1)
            return this.send(this.getString(`wellFarMessage`, `list`, `noMessages`, `${this.type}`));

        let message = result[Math.floor(Math.random() * result.length)].content;
        message = message.replace(`%u`, `<@!${this.msg.author.id}>`);
        this.msg.guild.systemChannel.send(message);
    }
    help() {
        let descMsg = `
            \`${botConfig.prefix} ${this.args[0]} add <message>\` - Adds a new message to the pool
            \`${botConfig.prefix} ${this.args[0]} remove <message id>\` - Removes the message from the pool
            \`${botConfig.prefix} ${this.args[0]} list\` - Shows all messages with their ID
            \`${botConfig.prefix} ${this.args[0]} test\` - Sends a test message
            \`${botConfig.prefix} ${this.args[0]} help\` - You're here
        `;
        this.sendHelp(`Welcome/Farewell Message`, descMsg);
    }
}

async function onMemberAction(member, type) {
    let result = await db.query("SELECT `content` FROM `welcomeMsgs` WHERE `serverFK` = ? AND `msgType` = ?", [member.guild.id, type]);
    if (result.length < 1) return;

    let message = result[Math.floor(Math.random() * result.length)].content;
    message = (type ? message.replace(`%u`, `\`${member.user.tag}\``) : message.replace(`%u`, `<@!${member.user.id}>`));
    member.guild.systemChannel.send(message);
}

client.on(`guildMemberAdd`, async (member) => {onMemberAction(member, 0)});
client.on(`guildMemberRemove`, async (member) => {onMemberAction(member, 1)});

module.exports = {
    name: `welcomemessage`,
    aliases: [`wm`, `farewellmessage`, `fm`],
    execute(msg, args) {new WelcomeMsg(msg, args)}
}