const { createServer } = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");
const db = require("./db.js");
require("dotenv").config();

const signingSecret = process.env.SLACK_SIGNING_SECRET;
const token = process.env.SLACK_BOT_TOKEN;

// Initialize
const slackEvents = createEventAdapter(signingSecret);
const web = new WebClient(token);
const port = 3001;
const app = express();

// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
const conversationId = "#space-pod";
const validQueryTypes = ["daily", "retro", "points", "planning", "all"];
const validMutationTypes = ["set"];

const queryMessageStructure = {
  BOT_NAME: 0,
  FILE_TYPE: 1,
};

const mutationMessageStructure = {
  BOT_NAME: 0,
  ACTION_TYPE: 1,
  FILE_TYPE: 2,
  URL: 3,
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
async function handleBotMention(message) {
  const { isValid, typeOfMessage, typeOfFile, fileToSet } = validateMessage(
    message
  );
  if (isValid) {
    console.log("TYPE OF MESSAGE", typeOfMessage);
    if (typeOfMessage === "query") {
      if (typeOfFile === "all") {
        try {
          const files = await db.getAll(conversationId);
          if (files) {
            let message = files.reduce((message, file) => {
              message += `\`${file.name}\`: ${file.url} \n`;
              return message;
            }, "");

            sendMessage(conversationId, message);
          } else {
            sendMessage(
              conversationId,
              `Oops! No files have been set yet on this channel. Add some by running \`set $type $url\``
            );
          }
        } catch {
          sendMessage(
            conversationId,
            `Oops! Something happened and the file couldn't be retrieved :( Try again!`
          );
        }
      } else {
        try {
          const file = await db.getFile(conversationId, typeOfFile);
          if (file) {
            sendMessage(conversationId, file);
          } else {
            sendMessage(
              conversationId,
              `Oops! No file has been set for ${typeOfFile} yet. Add one by running \`set ${typeOfFile} $url\``
            );
          }
        } catch {
          sendMessage(
            conversationId,
            `Oops! Something happened and the file couldn't be retrieved :( Try again!`
          );
        }
      }
    } else {
      try {
        await db.saveFile(conversationId, typeOfFile, fileToSet);
        sendMessage(conversationId, "File saved successfully!");
      } catch (e) {
        console.log("ERROR", e);
        sendMessage(
          conversationId,
          `Oh no! Something happened and the file couldn't be saved :( Try again!`
        );
      }
    }
  } else if (message.includes(" help")) {
    runHelp();
  } else {
    // We have to create another function to say that message is incorrect
    sendMessage(
      conversationId,
      `Oops! That's not a valid command. Run \`help\` to see available commands.`
    );
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
  let messagePieces = message.split(" ");
  let typeOfMessage = "none";
  let typeOfFile = "not_defined";
  let fileToSet = null;

  const resultValidationQueryFile = isFileTypeValid(
    messagePieces[queryMessageStructure.FILE_TYPE] || ""
  );
  const resultValidationAction = isActionTypeValid(
    messagePieces[mutationMessageStructure.ACTION_TYPE] || ""
  );
  const resultValidationMutationFile = isFileTypeValid(
    messagePieces[mutationMessageStructure.FILE_TYPE] || ""
  );

  if (resultValidationAction.isValid && resultValidationMutationFile.isValid) {
    if (messagePieces[mutationMessageStructure.URL]) {
      isValid = true;
      typeOfMessage = "mutation";
      typeOfFile = resultValidationMutationFile.type;
      fileToSet = messagePieces[mutationMessageStructure.URL];
    }
  } else if (resultValidationQueryFile.isValid) {
    isValid = true;
    typeOfMessage = "query";
    typeOfFile = resultValidationQueryFile.type;
  }
  return { isValid, typeOfMessage, typeOfFile, fileToSet };
}

function isFileTypeValid(message) {
  var isValid = false;
  var fileType = null;
  for (const type of validQueryTypes) {
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
  sendMessage(
    conversationId,
    `Type @FilesBot with either \`daily\`, \`retro\`, \`points\`, \`planning\` or \`all\` to get the url you need.`
  );
}
