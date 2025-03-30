import { Request, Response } from 'express';
import OpenAI from 'openai';
import { envConfig } from '../../config/env.config';

const openai = new OpenAI({ apiKey: envConfig.openai.apiKey });

/**
 * Express handler for enhanced OpenAI chat completions with prompt improvement
 * This endpoint is used when:
 * 1. You want to automatically enhance user prompts for better results
 * 2. You need the flexibility of both streaming and non-streaming responses
 * 
 * The handler first processes the original prompt through GPT-3.5-turbo-instruct
 * to create a more detailed version, then uses this enhanced prompt for the final completion.
 * 
 * @param req - Express request object containing:
 *   - model: OpenAI model to use (defaults to gpt-3.5-turbo)
 *   - messages: Array of chat messages
 *   - max_tokens: Maximum tokens to generate (defaults to 150)
 *   - temperature: Sampling temperature (defaults to 0.7)
 *   - stream: Boolean flag for streaming mode
 * @param res - Express response object for returning completion data
 */
export const openaiAdvanced = async (req: Request, res: Response) => {
  try {
    const {
      model,
      messages,
      max_tokens,
      temperature,
      stream,
      call,
      ...restParams
    } = req.body;

    // Extract the last message from the conversation
    const lastMessage = messages?.[messages.length - 1];
    
    // Generate an enhanced version of the prompt using GPT-3.5-turbo-instruct
    const prompt = await openai.completions.create({
      model: 'gpt-3.5-turbo-instruct',
      prompt: `
        Create a prompt which can act as a prompt templete where I put the original prompt and it can modify it according to my intentions so that the final modified prompt is more detailed.You can expand certain terms or keywords.
        ----------
        PROMPT: ${lastMessage.content}.
        MODIFIED PROMPT: `,
      max_tokens: 500,
      temperature: 0.7,
    });

    // Create a new message array with the enhanced prompt
    const modifiedMessage = [
      ...messages.slice(0, messages.length - 1),
      { ...lastMessage, content: prompt.choices[0].text },
    ];

    if (stream) {
      // Handle streaming mode with enhanced prompt
      const completionStream = await openai.chat.completions.create({
        model: model || 'gpt-3.5-turbo',
        ...restParams,
        messages: modifiedMessage,
        max_tokens: max_tokens || 150,
        temperature: temperature || 0.7,
        stream: true,
      } as OpenAI.Chat.ChatCompletionCreateParamsStreaming);
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const data of completionStream) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
      res.end();
    } else {
      // Handle non-streaming mode with enhanced prompt
      const completion = await openai.chat.completions.create({
        model: model || 'gpt-3.5-turbo',
        ...restParams,
        messages: modifiedMessage,
        max_tokens: max_tokens || 150,
        temperature: temperature || 0.7,
        stream: false,
      });
      return res.status(200).json(completion);
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e });
  }
};
