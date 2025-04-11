const express = require("express");

import { Request, Response } from "express";
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Node + TypeScript Server is running!');
});

// Start server
app.listen(port, () => {
  console.log(`Hello Server running on http://localhost:${port}`);
});

export default app;