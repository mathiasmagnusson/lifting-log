import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";

import { auth, authed, withAuth } from "./auth";
import { errorHandler } from "./errors";
import exercises from "./exercises";
import logs from "./logs";

const dev = process.env.NODE_ENV === "dev";

const app = express();

app.use(cookieParser());
app.use(express.json());
if (dev) app.use(morgan("dev"));
app.use(cors());
app.use(express.static("public/"));
app.use(authed);

// routers
app.use("/auth", auth);
app.use("/logs", withAuth, logs);
app.use("/exercises", exercises);

app.use(errorHandler);

app.listen(8080, "localhost");
