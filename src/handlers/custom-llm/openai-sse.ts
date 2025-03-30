import { Request, Response } from 'express';
import OpenAI from 'openai';
import { envConfig } from '../../config/env.config';

const openai = new OpenAI({ apiKey: envConfig.openai.apiKey });

/**
 * Express handler for OpenAI chat completions with Server-Sent Events (SSE) support
 * This endpoint is typically used when:
 * 1. You need real-time streaming responses from OpenAI's chat completions
 * 2. You want to handle both streaming and non-streaming requests in one endpoint
 * 
 * @param req - Express request object containing:
 *   - model: OpenAI model to use (defaults to gpt-3.5-turbo)
 *   - messages: Array of chat messages
 *   - max_tokens: Maximum tokens to generate (defaults to 150)
 *   - temperature: Sampling temperature (defaults to 0.7)
 *   - stream: Boolean flag for streaming mode
 * @param res - Express response object for returning completion data
 */
export const openaiSSE = async (req: Request, res: Response) => {
  try {
    // Destructure request body to get configuration parameters
    const {
      model,
      messages,
      max_tokens,
      temperature,
      call,
      stream,
      ...restParams
    } = req.body;

    console.log(req.body);

    if (stream) {
      // Handle streaming mode - uses SSE for real-time responses
      const completionStream = await openai.chat.completions.create({
        model: model || 'gpt-3.5-turbo',
        ...restParams,
        messages,
        max_tokens: max_tokens || 150,
        temperature: temperature || 0.7,
        stream: true,
      } as OpenAI.Chat.ChatCompletionCreateParamsStreaming);

      // Set headers for SSE connection
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream each chunk of the response to the client
      for await (const data of completionStream) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
      res.end();
    } else {
      // Handle non-streaming mode - returns complete response at once
      const completion = await openai.chat.completions.create({
        model: model || 'gpt-3.5-turbo',
        ...restParams,
        messages,
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
