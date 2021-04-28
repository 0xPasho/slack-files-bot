// const { App } = require("@slack/bolt");
const { createServer } = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");

// An access token (from your Slack app or custom integration - xoxp, xoxb)
const signingSecret = "a73dc099a1951d345647165b635af776";
const token = "xoxb-2004757421590-2011577199250-aupPrfygVF0VOag3OaWEcvh2";

// Initialize
const slackEvents = createEventAdapter(signingSecret);
const web = new WebClient(token);
const port = 3001;
const app = express();

// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
const conversationId = "#general";
const valid_types = ["daily", "retro", "points", "planning"];
const idChannel = '<@U020BGZ5V7C>';

app.use("/slack/events", slackEvents.expressMiddleware());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const server = createServer(app);
server.listen(port, () => {
  // Log a message when the server is ready
  console.log(`Listening for events on ${server.address().port}`);
});

(async () => {
  // See: https://api.slack.com/methods/chat.postMessage
  const res = await web.chat.postMessage({
    channel: conversationId,
    text: "Hello there! Ask me for any sprint-related files :)",
  });

  // `res` contains information about the posted message
  console.log("Message sent: ", res.ts);
})();

slackEvents.on("app_mention", (event) => {
  handleEvent(event.text);
});

// Respons to Data
function handleEvent(message) {
  let processedMessage = clearMessage(idChannel, message);
  if (message.includes(" set")) {
    processedMessage = clearMessage(" set", processedMessage);
    const { isValid, type } = isTypeValid(message);
    if (isValid) {
      processedMessage = clearMessage(" set", type);
      //setNewFileUrl(type, url, conversationId);
    }
  } else {
    if (message.includes(" help")) {
      runHelp();
    } else {
      const { isValid, type } = isTypeValid(message);
      if (isValid) {
        // sendMessage(conversationId, getMessage(conversationId, type))
      } else {
        // handle error
      }
    }
  }
}

function clearMessage(textToPurge, message) {
  return message.replace(textToPurge, '');
} 

function isTypeValid(message) {
  var valid = false;
  var type = null;
  for (const type in valid_types) {
    if (message.includes(type)) {
      valid = true;
      type = type;
    }
  }
  return { isValid: valid, type };
}

async function sendMessage(channelID, message) {
  await web.chat.postMessage({
    channel: channelID,
    text: message,
  });
}

// Show Help Text
function runHelp() {
  const params = {
    icon_emoji: ":question:",
  };

  bot.postMessageToChannel(
    conversationId,
    `Type @filesBot with either 'daily', 'ponts', 'retro' or 'planning' to get the file you need.`,
    params
  );
}
