import {removeAlertActionRow, skinNameAndEmoji, wait} from "../misc/util.js";
import {deleteUser, getUser, getUserList} from "../valorant/auth.js";
import {discordTag, fetchChannel, getChannelGuildId, removeAlertActionRow, skinNameAndEmoji, wait} from "../misc/util.js";
import {deleteUserAuth, getUser, getUserList} from "../valorant/auth.js";
import {getOffers} from "../valorant/shop.js";
import {getSkin} from "../valorant/cache.js";
import fs from "fs";
import {basicEmbed, VAL_COLOR_1} from "./embed.js";
import {client} from "./bot.js";
import config from "../misc/config.js";
import {s} from "../misc/languages.js";
import {l, s} from "../misc/languages.js";
import {readUserJson, saveUser} from "../valorant/accountSwitcher.js";
import {sendShardMessage} from "../misc/shardMessage.js";

let alerts = [];

let client;
export const setClient = (theClient) => client = theClient;

/* Alert format: {
 *     id: discord user id
 *     uuid: skin uuid
 *     channel_id: discord text channel id the alert was sent in
 * }
 * There should only be one alert per ID/UUID pair, i.e. each user can have one alert per skin.
 * Each user should have one alert per skin.
 */

export const loadAlerts = (filename="data/alerts.json") => {
    try {
        alerts = JSON.parse(fs.readFileSync(filename).toString());
        saveAlerts(filename);
    } catch(e) {}
}
export const addAlert = (id, alert) => {
    const user = getUser(id);
    if(!user) return;

const saveAlerts = (filename="data/alerts.json") => {
    fs.writeFileSync(filename, JSON.stringify(alerts, null, 2));
    user.alerts.push(alert);
    saveUser(user);
}

export const addAlert = (alert) => {
    alerts.push(alert);
    saveAlerts();
}
export const alertsForUser = (id, account=null) => {
    if(account === -1) { // -1 to get all alerts for user across accounts
        const user = readUserJson(id);
        if(!user) return [];

export const alertExists = (id, uuid) => {
    return alerts.filter(alert => alert.id === id && alert.uuid === uuid)[0] || false;
        return user.accounts.map(account => account.alerts).flat();
    }

    const user = getUser(id, account);
    if(user) return user.alerts;
    return [];
}

export const alertsForUser = (id) => {
    return alerts.filter(alert => alert.id === id);
export const alertExists = (id, uuid) => {
    return alertsForUser(id).find(alert => alert.uuid === uuid) || false;
}

export const filteredAlertsForUser = async (interaction) => {
    let alerts = alertsForUser(interaction.user.id);

    // filter out alerts for deleted channels
    const removedChannels = [];
    for(const alert of alerts) {
        if(removedChannels.includes(alert.channel_id)) continue;

        const channel = await client.channels.fetch(alert.channel_id).catch(() => {});
        if(!channel) {
            removeAlertsInChannel(alert.channel_id);
            removedChannels.push(alert.channel_id);
        }
    }
    if(removedChannels.length) alerts = alertsForUser(interaction.user.id);

    // bring the alerts in this channel to the top
    const alertPriority = (alert) => {
        if(alert.channel_id === interaction.channelId) return 2;
        if(interaction.guild && client.channels.cache.get(alert.channel_id).guildId === interaction.guild.id) return 1;
        const channel = client.channels.cache.get(alert.channel_id)
        if(interaction.guild && channel && channel.client.channels.cache.get(alert.channel_id).guildId === interaction.guild.id) return 1;
        return 0;
    }
    alerts.sort((alert1, alert2) => alertPriority(alert2) - alertPriority(alert1));

    return alerts;
}

export const alertsForGuild = async (id) => {
    const guild = await client.guilds.fetch(id);
    if(!guild) return [];
export const alertsPerChannelPerGuild = async () => {
    const guilds = {};
    for(const id of getUserList()) {
        const alerts = alertsForUser(id, -1);
        for(const alert of alerts) {
            const guildId = await getChannelGuildId(alert.channel_id);

    const alertsInGuild = [];
    for(const alert of alerts) {
        if(guild.channels.cache.has(alert.channel_id)) alertsInGuild.push(alert);
            if(!(guildId in guilds)) guilds[guildId] = {};
            if(!(alert.channel_id in guilds[guildId])) guilds[guildId][alert.channel_id] = 1;
            else guilds[guildId][alert.channel_id]++;
        }
    }

    return alertsInGuild;
    return guilds;
}

export const removeAlert = (id, uuid) => {
    const alertCount = alerts.length;
    alerts = alerts.filter(alert => alert.id !== id || alert.uuid !== uuid);
    saveAlerts();
    return alertCount > alerts.length;
}

export const removeAlertsFromUser = (id) => {
    alerts = alerts.filter(alert => alert.id !== id);
    saveAlerts();
}

export const removeAlertsInChannel = (channel_id) => {
    alerts = alerts.filter(alert => alert.channel_id !== channel_id);
    saveAlerts();
    const user = getUser(id);
    const alertCount = user.alerts.length;
    user.alerts = user.alerts.filter(alert => alert.uuid !== uuid);
    saveUser(user);
    return alertCount > user.alerts.length;
}

export const checkAlerts = async () => {
    if(!alerts) return;
    if(client.shard && !client.shard.ids.includes(0)) return; // only run on the first shard

    console.log("Checking new shop skins for alerts...");

    try {
        let shouldWait = false;

        for(const id of getUserList()) {
            const userAlerts = alerts.filter(alert => alert.id === id);
            if(!userAlerts.length) continue;

            const offers = await getOffers(id);
            if(!offers.success) {
                if(offers.maintenance) return; // retry in a few hours?

                // user login is invalid
                const channelsSent = [];
                for(const alert of userAlerts) {
                    if(!channelsSent.includes(alert.channel_id)) {
                        await sendCredentialsExpired(alert);
                        channelsSent.push(alert.channel_id);
            try {
                let credsExpiredAlerts = false;

                const userJson = readUserJson(id);
                if(!userJson) continue;

                const accountCount = userJson.accounts.length;
                for(let i = 1; i <= accountCount; i++) {

                    const userAlerts = alertsForUser(id, i);
                    if(!userAlerts || !userAlerts.length) continue;

                    if(shouldWait) {
                        await wait(config.delayBetweenAlerts); // to prevent being ratelimited
                        shouldWait = false;
                    }

                    const valorantUser = getUser(id, i);
                    const discordUser = client.users.cache.get(id);
                    const discordUsername = discordUser ? discordUser.username : id;
                    console.log(`Checking user ${discordUsername}'s ${valorantUser.username} account (${i}/${accountCount}) for alerts...`);

                    const offers = await getOffers(id, i);
                    shouldWait = valorantUser.auth && !offers.cached;

                    if(!offers.success) {
                        if(offers.maintenance) return; // retry in a few hours?

                        if(!credsExpiredAlerts) {
                            if(valorantUser.authFailures < config.authFailureStrikes) {
                                valorantUser.authFailures++;
                                credsExpiredAlerts = userAlerts;
                            }
                        }
                        deleteUserAuth(valorantUser);
                        continue;
                    }
                }
                deleteUser(id);
                await wait(config.delayBetweenAlerts);
                continue;
            }

            const positiveAlerts = userAlerts.filter(alert => offers.offers.includes(alert.uuid));
            if(positiveAlerts.length) await sendAlert(positiveAlerts, offers.expires);
                    const positiveAlerts = userAlerts.filter(alert => offers.offers.includes(alert.uuid));
                    if(positiveAlerts.length) await sendAlert(id, i, positiveAlerts, offers.expires);
                }

            await wait(config.delayBetweenAlerts); // to prevent being ratelimited
                if(credsExpiredAlerts) {
                    // user login is invalid
                    const channelsSent = [];
                    for(const alert of credsExpiredAlerts) {
                        if(!channelsSent.includes(alert.channel_id)) {
                            await sendCredentialsExpired(id, alert);
                            channelsSent.push(alert.channel_id);
                        }
                    }
                }
            } catch(e) {
                console.error("There was an error while trying to fetch and send alerts for user " + discordTag(id));
                console.error(e);
            }
        }

        console.log("Finished checking alerts!");
    } catch(e) {
        // should I send messages in the discord channels?
        console.error("There was an error while trying to send alerts!");
        console.error(e);
    }
}

const sendAlert = async (alerts, expires) => {
    console.log(`Sending alerts...`);
export const sendAlert = async (id, account, alerts, expires, tryOnOtherShard=true) => {
    const user = client.users.cache.get(id);
    const username = user ? user.username : id;
    console.log(`Sending ${alerts.length} alerts for user ${username}...`);

    for(let i = 0; i < alerts.length; i++) {
        let alert = alerts[i];

        const valorantUser = getUser(alert.id);
    for(const alert of alerts) {
        const valorantUser = getUser(id, account);
        if(!valorantUser) return;

        const channel = await client.channels.fetch(alert.channel_id).catch(() => {});
        const channel = await fetchChannel(alert.channel_id);
        if(!channel) {
            removeAlertsInChannel(alert.channel_id);
            while(i < alerts.length && (i === alerts.length - 1 || alerts[i].channel_id === alerts[i+1].channel_id)) {
                i++;
            if(client.shard && tryOnOtherShard) {
                sendShardMessage({
                    type: "alert",
                    alerts: [alert],
                    id, account, expires
                });
            }
            continue;
        }

        const skin = await getSkin(alert.uuid);
        console.log(`User ${valorantUser.username} has the skin ${l(skin.names)} in their shop!`);

        await channel.send({
            content: `<@${alert.id}>`,
            content: `<@${id}>`,
            embeds: [{
                description: s(valorantUser.locale).info.ALERT_HAPPENED.f({u: alert.id, s: await skinNameAndEmoji(skin, channel, valorantUser.locale), t: expires}),
                description: s(valorantUser.locale).info.ALERT_HAPPENED.f({i: id, u:valorantUser.username, s: await skinNameAndEmoji(skin, channel, valorantUser.locale), t: expires}),
                color: VAL_COLOR_1,
                thumbnail: {
                    url: skin.icon
                }
            }],
            components: [removeAlertActionRow(alert.id, alert.uuid, s(valorantUser.locale).info.REMOVE_ALERT_BUTTON)]
            components: [removeAlertActionRow(id, alert.uuid, s(valorantUser.locale).info.REMOVE_ALERT_BUTTON)]
        }).catch(async e => {
            console.error(`Could not send alert message in #${channel.name}! Do I have the right role?`);

            try { // try to log the alert to the console
                const user = await client.users.fetch(alert.id).catch(() => {});
                const user = await client.users.fetch(id).catch(() => {});
                if(user) console.error(`Please tell ${user.tag} that the ${skin.name} is in their item shop!`);
            } catch(e) {}

@@ -180,33 +202,41 @@ const sendAlert = async (alerts, expires) => {
    }
}

const sendCredentialsExpired = async (alert) => {
    const channel = await client.channels.fetch(alert.channel_id).catch(() => {});
export const sendCredentialsExpired = async (id, alert, tryOnOtherShard=true) => {
    const channel = await fetchChannel(alert.channel_id);
    if(!channel) {
        const user = await client.users.fetch(alert.id).catch(() => {});
        if(user) console.error(`Please tell ${user.tag} that their credentials have expired, and that they should /login again.`);
        return removeAlertsInChannel(alert.channel_id);
        if(client.shard && tryOnOtherShard) {
            sendShardMessage({
                type: "alertCredentialsExpired",
                id, alert
            });
            return;
        }

        const user = await client.users.fetch(id).catch(() => {});
        if(user) console.error(`Please tell ${user.tag} that their credentials have expired, and that they should /login again. (I can't find the channel where the alert was set up)`);
        return;
    }

    if(channel.guild) {
        const memberInGuild = await channel.guild.members.fetch(alert.id).catch(() => {});
        const memberInGuild = await channel.guild.members.fetch(id).catch(() => {});
        if(!memberInGuild) return; // the user is no longer in that guild
    }

    const valorantUser = getUser(alert.id);
    const valorantUser = getUser(id);
    if(!valorantUser) return;

    await channel.send({
        content: `<@${alert.id}>`,
        content: `<@${id}>`,
        embeds: [{
            description: s(valorantUser.locale).error.AUTH_ERROR_ALERTS_HAPPENED.f({u: alert.id}),
            description: s(valorantUser.locale).error.AUTH_ERROR_ALERTS_HAPPENED.f({u: id}),
            color: VAL_COLOR_1,
        }]
    }).catch(async e => {
        console.error(`Could not send message in #${channel.name}! Do I have the right role?`);

        try { // try to log the alert to the console
            const user = await client.users.fetch(alert.id).catch(() => {});
            const user = await client.users.fetch(id).catch(() => {});
            if(user) console.error(`Please tell ${user.tag} that their credentials have expired, and that they should /login again. Also tell them that they should fix their perms.`);
        } catch(e) {}

@@ -216,7 +246,7 @@ const sendCredentialsExpired = async (alert) => {

export const testAlerts = async (interaction) => {
    try {
        const channel = interaction.channel || await client.channels.fetch(interaction.channel_id);
        const channel = interaction.channel || await fetchChannel(interaction.channel_id);
        await channel.send({
            embeds: [basicEmbed(s(interaction).info.ALERT_TEST)]
        });
