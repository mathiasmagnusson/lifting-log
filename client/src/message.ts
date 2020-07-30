import { writable } from "svelte/store";

export interface Message {
	message: string;
	type: "error" | "message";
}

export function onMessage(msg: { message: string, type: "error" | "message" }): void {
	if (!msg.type) msg.type = "error";

	messages.update(prev => [...prev, msg]);

	setTimeout(
		() => messages.update(prev => prev.filter(msg => msg !== msg)),
		3000,
	);
}

export const messages = writable<Message[]>([]);
