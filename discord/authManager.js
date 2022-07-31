import {getAuthQueueItemStatus, Operations, queue2FACodeRedeem, queueUsernamePasswordLogin} from "../valorant/authQueue.js";
import {actionRow, retryAuthButton, wait} from "../misc/util.js";
import {getUser} from "../valorant/auth.js";
import {getUser, setUserLocale} from "../valorant/auth.js";
import {authFailureMessage, basicEmbed} from "./embed.js";
import {s} from "../misc/languages.js";
import config from "../misc/config.js";
@@ -23,14 +23,15 @@ export const loginUsernamePassword = async (interaction, username, password, ope
            embeds: [basicEmbed(s(interaction).info.LOGGED_IN.f({u: user.username}))],
            ephemeral: true
        });
        user.locale = interaction.locale;
        setUserLocale(user, interaction.locale);

        if(operationIndex !== null) {
            const index = failedOperations.findIndex(o => o.index === operationIndex);
            if(index > -1) failedOperations.splice(operationIndex, 1);
        }
    } else if(login.error) {
        console.log(`${interaction.user.tag} login error`);
        console.error(`${interaction.user.tag} login error`);
        console.error(login.error);
        const index = operationIndex || generateOperationIndex();
        failedOperations.push({
            c: index,
@@ -65,9 +66,10 @@ export const login2FA = async (interaction, code, operationIndex=null) => {
        await interaction.followUp({
            embeds: [basicEmbed(s(interaction).info.LOGGED_IN.f({u: user.username}))]
        });
        user.locale = interaction.locale;
        setUserLocale(user, interaction.locale);
    } else if(login.error) {
        console.log(`${interaction.user.tag} 2FA error`);
        console.error(`${interaction.user.tag} 2FA error`);
        console.error(login.error);
        const index = operationIndex || generateOperationIndex();
        failedOperations.push({
            c: index,
