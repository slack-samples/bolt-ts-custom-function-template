import { App, type BlockAction, LogLevel } from '@slack/bolt';
import { config } from 'dotenv';

config();

/** Initialization */
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: LogLevel.DEBUG,
});

/** Sample Function Listener */
app.function('sample_function', async ({ client, inputs, fail, logger }) => {
  try {
    const { user_id } = inputs;

    await client.chat.postMessage({
      channel: user_id as string,
      text: 'Click the button to signal the function has completed',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Click the button to signal the function has completed',
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Complete function',
            },
            action_id: 'sample_button',
          },
        },
      ],
    });
  } catch (error) {
    logger.error(error);
    fail({ error: `Failed to handle a function request: ${error}` });
  }
});

/** Sample Action Listener */
app.action<BlockAction>('sample_button', async ({ body, client, complete, fail, logger }) => {
  const { channel, message, user } = body;

  try {
    // Functions should be marked as successfully completed using `complete` or
    // as having failed using `fail`, else they'll remain in an 'In progress' state.
    // Learn more at https://api.slack.com/automation/interactive-messages
    // biome-ignore lint/style/noNonNullAssertion: we know this button comes from a function, so `fail` is available.
    await complete!({ outputs: { user_id: user.id } });

    await client.chat.update({
      // biome-ignore lint/style/noNonNullAssertion: we know this button was posted to a channel, so `channel` is available.
      channel: channel!.id,
      // biome-ignore lint/style/noNonNullAssertion: we know this button was posted to a channel, so `message` is available.
      ts: message!.ts,
      text: 'Function completed successfully!',
    });
  } catch (error) {
    logger.error(error);
    // biome-ignore lint/style/noNonNullAssertion: we know this button comes from a function, so `fail` is available.
    fail!({ error: `Failed to handle a function request: ${error}` });
  }
});

/** Start the Bolt App */
(async () => {
  try {
    await app.start();
    app.logger.info('⚡️ Bolt app is running!');
  } catch (error) {
    app.logger.error('Failed to start the app', error);
  }
})();
