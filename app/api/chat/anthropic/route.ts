import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits";
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers";
import { ChatSettings } from "@/types";
import Anthropic from "@anthropic-ai/sdk";
import { AnthropicStream, StreamingTextResponse } from "ai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const json = await request.json();
  const { chatSettings, messages } = json as {
    chatSettings: ChatSettings;
    messages: any[];
  };

  try {
    const profile = await getServerProfile();
    checkApiKey(profile.anthropic_api_key, "Anthropic");
    let ANTHROPIC_FORMATTED_MESSAGES: any = messages.slice(1);
    const anthropic = new Anthropic({
      apiKey: profile.anthropic_api_key || "",
    });

    try {
      const response = await anthropic.messages.create({
        model: chatSettings.model,
        messages: ANTHROPIC_FORMATTED_MESSAGES,
        temperature: chatSettings.temperature,
        system: messages[0].content,
        max_tokens: CHAT_SETTING_LIMITS[chatSettings.model].MAX_TOKEN_OUTPUT_LENGTH,
        stream: true,
      });
      const stream = AnthropicStream(response);
      return new StreamingTextResponse(stream);
    } catch (error: any) {
      console.error("Error calling Anthropic API:", error);
      return new NextResponse(
        JSON.stringify({ message: "An error occurred while calling the Anthropic API" }),
        { status: 500 }
      );
    }
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred";
    const errorCode = error.status || 500;
    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage = "Anthropic API Key not found. Please set it in your profile settings.";
    } else if (errorCode === 401) {
      errorMessage = "Anthropic API Key is incorrect. Please fix it in your profile settings.";
    }
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: errorCode,
    });
  }
}