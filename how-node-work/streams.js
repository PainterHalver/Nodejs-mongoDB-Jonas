const fs = require("fs");
const server = require("http").createServer();

server.on("request", (req, res) => {
  // Solution 1
  // fs.readFile("./how-node-work/test-file.txt", (err, data) => {
  //   if (err) console.error(err);
  //   res.end(data);
  // });

  // Solution 2: Streams
  // const readable = fs.createReadStream("./how-node-work/test-file.txt");
  // readable.on("data", (chunk) => {
  //   res.write(chunk);
  // });
  // readable.on("end", () => {
  //   res.end();
  // });
  // readable.on("error", (err) => {
  //   console.error(err);
  //   res.statusCode = 500;
  //   res.end("file not found");
  // });

  // Solution 3: fix the problem of backpressure (data from readable streams are faster than writeable streams)
  const readable = fs.createReadStream("./how-node-work/test-file.txt");
  readable.pipe(res); // Pipe (connect) the 2 streams (readable and res)
  // readableStream.pipe(writeableStream)
});

server.listen(8000, "127.0.0.1", () => {
  console.log("Listening on port 8000");
});
