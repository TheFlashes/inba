const CommandTemplate = require(`../my_modules/CommandTemplate.js`);

class Purge extends CommandTemplate {
    constructor(msg, args) {
        super(msg, args);

        if(!this.checkPermission(msg)) return;

        if (this.args.length < 2)
            return this.sendEmbed(0, this.getString(`purge`, `error`, `blankNumber`));

        if (isNaN(this.args[1]))
            return this.sendEmbed(0, this.getString(`purge`, `error`, `notValidNumber`));

        if (parseInt(this.args[1]) < 1 || parseInt(this.args[1]) > 100)
            return this.sendEmbed(0, this.getString(`purge`, `error`, `numberRange`));

        this.bulk();
    }
    bulk() {
        this.msg.delete();
        this.msg.channel.bulkDelete(this.args[1], false).then(m => {
            let successEmbed = this.returnEmbed(1, this.getString(`purge`, `success`, [m.size]));
            this.send(successEmbed, ms => {
                ms.delete({timeout: 3000});
            })
        }).catch(e => {
            console.error(e);
            this.sendEmbed(0, this.getString(`purge`, `error`, `bulk`, [e.message]));
        })
    }
}

module.exports = {
    name: `purge`,
    aliases: [`p`],
    execute(msg, args) {new Purge(msg, args)}
}