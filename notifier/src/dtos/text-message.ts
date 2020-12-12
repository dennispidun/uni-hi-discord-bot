import { IsAlpha, IsHexColor, IsNotEmpty } from "class-validator";

export abstract class DiscordMessage {
    @IsNotEmpty()
    channel: string;

    @IsNotEmpty()
    type: "text" | "embed";    
}

export class TextMessage extends DiscordMessage {
    @IsNotEmpty()
    message: string;
}

export class EmbedMessage extends DiscordMessage {
    @IsNotEmpty()
    content: string;
    @IsHexColor()
    color: string;

    title: string;

    url: string;
}