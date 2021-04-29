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
const validQueryTypes = ["daily", "retro", "points", "planning"];
const validMutationTypes = ["set"];
const idChannel = '<@U020BGZ5V7C>';

const queryMessageStructure = {
  BOT_NAME: 0,
  FILE_TYPE: 1,
};

const mutationMessageStructure = {
  BOT_NAME: 0,
  ACTION_TYPE: 1,
  FILE_TYPE: 2,
  URL: 3
};

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
  handleBotMention(event.text);
});

// Response to Data
function handleBotMention(message) {
  const { isValid, typeOfMessage, typeOfFile } = validateMessage(message);
  if(isValid) {
    
    sendMessage(conversationId, `Message sent, trying to do a ${typeOfMessage}, to file ${typeOfFile} `);
  }
  else if(message.includes(" help")) {
    runHelp();
  }
  else {
    // We have to create another function to say that message is incorrect
    runHelp();
  }
}


/**
 * Basically how it works is: we split the spaces in the string, then 
 * based on the array positions we expect certain type of files or actions.
 * @param {string} message 
 * @returns {object}
 */
function validateMessage(message) {
  let isValid = false;
  let messagePieces = message.split(' ');
  let typeOfMessage = "none";
  let typeOfFile = "not_defined";

  const resultValidationQueryFile = isFileTypeValid(messagePieces[queryMessageStructure.FILE_TYPE] || '')
  const resultValidationAction = isActionTypeValid(messagePieces[mutationMessageStructure.ACTION_TYPE] || '');
  const resultValidationMutationFile = isFileTypeValid(messagePieces[mutationMessageStructure.FILE_TYPE] || '');

  if(resultValidationQueryFile.isValid) {
    isValid = true;
    typeOfMessage = "query";
    typeOfFile = resultValidationQueryFile.type;
  }
  else if(
    resultValidationAction.isValid && 
    resultValidationMutationFile.isValid &&
    messagePieces[mutationMessageStructure.URL]
  ) {
    isValid = true;
    typeOfMessage = "mutation";
    typeOfFile = resultValidationMutationFile.type;
  }
  return {isValid, typeOfMessage, typeOfFile };
}


function isFileTypeValid(message) {
  var isValid = false;
  var fileType = null;
  for (const type of validQueryTypes) {
     console.log({type, message})
  
    if (message.includes(type)) {
      isValid = true;
      fileType = type;
    }
  }
  return { isValid, type: fileType };
}

function isActionTypeValid(message) {
  var isValid = false;
  var actionType = null;
  for (const type of validMutationTypes) {
    if (message.includes(type)) {
      isValid = true;
      actionType = type;
    }
  }
  return { isValid, type: actionType };
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
    `Type @filesBot with either 'daily', 'ponts', 'retro' or 'planning' to get the url you need.`,
    params
  );
}
