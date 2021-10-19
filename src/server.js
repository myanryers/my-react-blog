import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();
const PORT = 8000;

app.use(express.static(path.join(__dirname, "/build")));
app.use(bodyParser.json());

const withDb = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
    });
    const db = client.db("my-blog");
    await operations(db);
    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to db", error });
  }
};

app.get("/api/articles/:name", async (req, res) => {
  withDb(async (db) => {
    const name = req.params.name;
    const articleInfo = await db.collection("articles").findOne({ name: name });
    res.status(200).json(articleInfo);
  }, res);
});

app.post("/api/articles/:name/upvote", async (req, res) => {
  withDb(async (db) => {
    const name = req.params.name;
    const info = await db.collection("articles").findOne({ name: name });
    await db.collection("articles").updateOne(
      { name: name },
      {
        $set: {
          upvotes: info.upvotes + 1,
        },
      }
    );
    const updatedInfo = await db.collection("articles").findOne({ name: name });
    res.status(200).json(updatedInfo);
  }, res);
});

app.post("/api/articles/:name/add-comment", async (req, res) => {
  const { username, text } = req.body;
  const name = req.params.name;
  withDb(async (db) => {
    const info = await db.collection("articles").findOne({ name: name });
    await db.collection("articles").updateOne(
      { name: name },
      {
        $set: {
          comments: [...info.comments, { username, text }],
        },
      }
    );
    const updatedInfo = await db.collection("articles").findOne({ name: name });
    res.status(200).json(updatedInfo);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
