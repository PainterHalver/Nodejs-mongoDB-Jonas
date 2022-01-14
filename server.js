const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

// Synchronous errors are "Uncaught exceptions"
// console.log(undefined_variable)
// Should be on top of any other code
process.on("uncaughtException", (error) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(error);
  process.exit(1);
});

const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

// options object is optional, here is just to remove the deprecation warnings
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((connection) => console.log("SUCCESSFULLY CONNECTED TO MONGODB!!!!"));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Unhandled rejected PROMISE only
process.on("unhandledRejection", (error) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(error);
  // Finish pending tasks before shutting down
  server.close(() => {
    process.exit(1);
  });
});
