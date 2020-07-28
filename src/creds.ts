import fs from "fs";
import path from "path";

export default JSON.parse(
	fs.readFileSync(
		path.resolve(__dirname, "..", "creds.json"), "utf8"
	)
);
