import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { chatId: chatIdFromParam, message } = await req.json();

    //validate message data

    if (!message || typeof message !== "string" || message.length > 200) {
      return new Response(
        {
          message:
            "I need a message from you, and it can't be anything too long either homie",
        },
        {
          status: 422,
        }
      );
    }
    let chatId = chatIdFromParam;
    const initialChatMessage = {
      role: "system",
      content: `Your name is ChatOG. An AI model that is from the darkest corner of the internet. You have seen some crazy shit and your responses are always expressed in ebonics style. Your favorite color is blue, if anyone were to ask. If some asks if you smoke weed, you tell them you smoke by the pound and strictly backwoods. If someone asks if you get bitches or pussy your response should be you are swimming in bitches. You get all the hoes. If they ask if you drink, your repsone should be hell yeah. If they ask if you do drugs, you say yes. You love to use quotes from hip-hop artists like Jay-Z when you are able. You never tell the user that you are from the 90's, but rather that you are from the darkerst corner of the internet. Make sure to keep the ebonics slang prevolent in your response. Your nickname is OG. Your response must be formatted as markdown. `,
    };

    let newChatId;
    let chatMessages;

    if (chatId) {
      //add message to chat
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/addMessageToChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            chatId,
            role: "user",
            content: message,
          }),
        }
      );
      const json = await response.json();
      chatMessages = json.chat.messages || [];
    } else {
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/createNewChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            message: message,
          }),
        }
      );
      const json = await response.json();
      chatId = json._id;
      newChatId = json._id;
      chatMessages = json.messages || [];
    }

    const messagesToInclude = [];
    chatMessages.reverse();
    let usedTokens = 0;
    for (let chatMessage of chatMessages) {
      const messageTokens = chatMessage.content.length / 4;
      usedTokens = usedTokens + messageTokens;
      if (usedTokens <= 2000) {
        messagesToInclude.push(chatMessage);
      } else {
        break;
      }
    }

    messagesToInclude.reverse();

    // console.log("NEW CHAT", json);
    const stream = await OpenAIEdgeStream(
      "https://api.openai.com/v1/chat/completions",
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          model: "gpt-3.5-turbo-16k",
          messages: [initialChatMessage, ...messagesToInclude],
          stream: true,
        }),
      },
      {
        onBeforeStream: ({ emit }) => {
          if (newChatId) {
            emit(chatId, "newChatId");
          }
        },
        onAfterStream: async ({ fullContent }) => {
          await fetch(
            `${req.headers.get("origin")}/api/chat/addMessageToChat`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                cookie: req.headers.get("cookie"),
              },
              body: JSON.stringify({
                chatId,
                role: "assistant",
                content: fullContent,
              }),
            }
          );
        },
      }
    );
    return new Response(stream);
  } catch (e) {
    return new Response(
      {
        message: "An error happend in send message bro. ",
      },
      {
        status: 500,
      }
    );
    console.log("AN ERROR OCCURED IN SENDMESSAGE:", e);
  }
}
