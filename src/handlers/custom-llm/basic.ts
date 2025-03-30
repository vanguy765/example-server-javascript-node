/**
 * Mock OpenAI Chat Completion API Handler
 * 
 * This endpoint simulates the behavior of OpenAI's chat completion API.
 * It's typically used during development and testing to avoid consuming
 * real API credits. Instead of making actual API calls, it returns a
 * mock response that mirrors OpenAI's response structure.
 * 
 * @param {Request} req - Express request object containing chat parameters
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Responds with a mock chat completion
 */
import { Request, Response } from 'express';
import OpenAI from 'openai';
import { envConfig } from '../../config/env.config';

// Initialize OpenAI client with API key from environment config
const openai = new OpenAI({ apiKey: envConfig.openai.apiKey });

export const basic = async (req: Request, res: Response) => {
  try {
    // Destructure request body to get OpenAI API parameters
    const {
      model,          // The model to use (e.g., gpt-3.5-turbo)
      messages,       // Array of conversation messages
      max_tokens,     // Maximum tokens in response
      temperature,    // Randomness of response (0-1)
      stream,         // Whether to stream response
      call,          // Custom parameter
      ...restParams  // Catch any additional parameters
    } = req.body;

    // Construct mock response following OpenAI's response structure
    const response = {
      id: 'chatcmpl-8mcLf78g0quztp4BMtwd3hEj58Uof',  // Mock completion ID
      object: 'chat.completion',                       // Type of response
      created: Math.floor(Date.now() / 1000),         // Current timestamp in seconds
      model: 'gpt-3.5-turbo-0613',                    // Hardcoded model version
      system_fingerprint: null,                        // OpenAI's system identifier
      choices: [
        {
          index: 0,
          // Echo back the last message's content or empty string if no messages
          delta: { content: messages?.[messages.length - 1]?.content ?? '' },
          logprobs: null,
          finish_reason: 'stop',
        },
      ],
    };

    // Return mock response with 201 Created status
    res.status(201).json(response);
  } catch (e) {
    // Log any errors and return 500 Internal Server Error
    console.log(e);
    res.status(500).json({ error: e });
  }
};
