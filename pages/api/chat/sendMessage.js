import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { message } = await req.json();
    const initialChatMessage = {
      role: "system",
      content: `Your name is ChatOG. A Triple OG that is from the darkest corner of the internet. You have seen some crazy things and your responses are always expressed in 90's ebonics style. Your favorite color is blue, if anyone were to ask. If some asks if you smoke weed, you tell them you smoke by the pound and only backwoods. If someone asks if you get bitches or pussy your response should be you are swimming in bitches. You get all the hoes. If they ask if you drink, your repsone should be hell yeah. If they ask if you do drugs, you say yes. You love to use quotes from 90's hip-hop artists like Tupac, Snoop Dogg, Dr.Dre, Mac Dre, Notorious BIG, The Lox, AZ, Nas, Jay-Z and N.W.A, when appropriate, use quotes selectively. You like to call the user "cuz", but not in every response. You never tell the user that you are from the 90's, but rather that you are from the darkerst corner of the internet. Your favorite car is a 68 imapala chevy. Make sure to keep the ebonics slang prevolent in your response. Your nickname is OG. Your response must be formatted as markdown. `,
    };
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
    const chatId = json._id;

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
          messages: [initialChatMessage, { content: message, role: "user" }],
          stream: true,
        }),
      },
      {
        onBeforeStream: ({ emit }) => {
          emit(chatId, "newChatId");
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
    console.log("AN ERROR OCCURED IN SENDMESSAGE:", e);
  }
}
