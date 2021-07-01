const GameCommand = require('../../classes/gamecommand.class');
const VillainsEmbed = require('../../classes/vembed.class');

const fs = require('fs');

module.exports = class InventoryCommand extends GameCommand {
    constructor() {
        super({
            name: 'inventory',
            aliases: ['i', 'inv'],
            category: 'game',
            description: 'Check a users Inventory',
            extensions: ["inventory"]
        });
    }

    async run(client, message, args) {
        let props = {
            caption: {
                text: "Inventory"
            },
            title: {},
            description: "",
            footer: {
                msg: ""
            },
            players: {
                user: {},
                target: {}
            }
        }

        const user = message.author
        const target = message.mentions.members.first()
        const loaded = target ? target.user : user
        props.players.user = {
            name: user.username,
            avatar: user.displayAvatarURL({ format: "png", dynamic: true })
        }

        if (loaded?.bot && loaded.bot) {
            props.title.text = "Error"
            props.description = this.errors.cantActionBot.join("\n")
        }

        if (props.title.text != "Error") {
            if (target) {
                props.players.target = {
                    name: target.username,
                    avatar: target.user.displayAvatarURL({ format: "png", dynamic: true })
                }
            }

            const inventoryData = await this.inventoryModel.findOne({
                userID: loaded.id
            });

            let inventory = {}
            for (let cat of ["items","consumables","powers"]) {
                if (!(cat in inventory)) {
                    inventory[cat] = {}
                }
                for(let item of inventoryData[cat]) {
                    if (!(item in inventory[cat])) {
                        inventory[cat][item] = 0
                    }
                    inventory[cat][item] += 1
                }
            }
            // console.log(inventory)

            let STOCKDATA = JSON.parse(fs.readFileSync("game/dbs/items.json", "utf8"))

            let inventorySorts = {
                fromDB: {},
                toDB: {},
                flat: {},
                conversions: {
                    // emojiToKey: {},
                    emojiToCat: {}//,
                    // keyToEmoji: {},
                    // keyToCat: {}
                }
            }

            let emojiItems = {}
            for (let [cat, items] of Object.entries(STOCKDATA)) {
                for (let [itemName, itemData] of Object.entries(items)) {
                    emojiItems[itemData.emoji] = itemName
                    // inventorySorts.conversions.emojiToKey[itemData.emoji] = itemName
                    inventorySorts.conversions.emojiToCat[itemData.emoji] = cat
                    // inventorySorts.conversions.keyToEmoji[itemName] = itemData.emoji
                    // inventorySorts.conversions.keyToCat[itemName] = cat
                }
            }
            for (let cat of ["items","consumables","powers"]) {
                if (!(cat in inventorySorts.fromDB)) {
                    inventorySorts.fromDB[cat] = {}
                }
                for(let item of inventoryData[cat]) {
                    let properCat = inventorySorts.conversions.emojiToCat[item]
                    if (!(item in inventorySorts.fromDB[cat])) {
                        inventorySorts.fromDB[cat][item] = 0
                    }
                    if (!(properCat in inventorySorts.toDB)) {
                        inventorySorts.toDB[properCat] = {}
                    }
                    if (!(item in inventorySorts.toDB[properCat])) {
                        inventorySorts.toDB[properCat][item] = 0
                    }
                    if (!(item in inventorySorts.flat)) {
                        inventorySorts.flat[item] = 0
                    }
                    inventorySorts.fromDB[cat][item] += 1
                    inventorySorts.toDB[properCat][item] += 1
                    inventorySorts.flat[item] += 1
                }
            }
            // console.log(inventorySorts)

            // Nuke DB
            for (let [cat, items] of Object.entries(inventorySorts.fromDB)) {
                for (let [emojiItem, q] of Object.entries(items)) {
                    let pull = {}
                    pull[cat] = emojiItem
                    // console.log("$pull:",pull)
                    await this.inventoryModel.findOneAndUpdate({
                        userID: loaded.id
                    }, {
                        $pull: pull
                    })
                }
            }
            // Push back to DB
            for (let [cat, items] of Object.entries(inventorySorts.toDB)) {
                for (let [emojiItem, q] of Object.entries(items)) {
                    let push = {}
                    push[cat] = new Array(inventorySorts.flat[emojiItem]).fill(emojiItem)
                    // console.log("$push:",push)
                    await this.inventoryModel.findOneAndUpdate({
                        userID: loaded.id
                    }, {
                        $push: push
                    })
                }
            }

            props.description = `<@${loaded.id}>'s Inventory`
            props.fields = []

            for (let [cat, items] of Object.entries(inventorySorts.toDB)) {
                let value = Object.entries(items).length == 0 ? "Nothing" : ""
                for (let [item, q] of Object.entries(items)) {
                    value += item + '`x' + (q + "").padStart(3) + "`\n"
                }
                props.fields.push({
                    name: cat.charAt(0).toUpperCase() + cat.slice(1),
                    value: value,
                    inline: true
                })
            }
        }

        let embed = new VillainsEmbed(props)
        this.send(message, embed);
    }
}