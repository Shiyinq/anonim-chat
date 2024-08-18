# Using Your Main Language
Here's how you can use your native language:

## 1. Create a File
Create a file with the short code of your language. For example:
- For English: `EN.json`
- For Indonesian: `ID.json`

## 2. Copy and Translate Data
1. Copy the sample data format from `ID.json` to your new file (e.g., `EN.json`).
2. Translate each value in the JSON to your language.
3. Important: Do not change any keys in the JSON.

## 3. Configure the Bot to Use Your Language
1. Open the `.env` file you have previously created.
2. Change the default language setting from `LANGUAGE=ID` to your language code, for example `LANGUAGE=EN` for English.

## Additional Notes
- Make sure to use the correct language code that matches the filename you created.
- If you encounter any issues, double-check that all steps have been followed correctly.
- The bot will use the language specified in the `.env` file for all its responses and interactions.
- Always restart the bot after making changes to the language settings to ensure they take effect.
