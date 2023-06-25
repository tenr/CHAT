import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);
    const { message } = req.body;

    //validate message data

    if (!message || typeof message !== "string" || message.length > 2000) {
      res.status(422).json({
        message:
          "I need a message from you, and it can't be anything too long either homie",
      });
      return;
    }

    const newUserMessage = {
      role: "user",
      content: message,
    };
    const client = await clientPromise;
    const db = client.db("ChatOG");
    const chat = await db.collection("chats").insertOne({
      userId: user.sub,
      messages: [newUserMessage],
      title: message,
    });
    res.status(200).json({
      _id: chat.insertedId.toString(),
      messages: [newUserMessage],
      title: message,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "An error occured when creating a  new chat" });
    console.log("error occured in create new char", e);
  }
}
