# Current State of the Project AI Manual Testing

Step 1: Ensure DynamoDB local is running
Step 2: Start the Local Server
Step 3:Ensure there are no errors launching the server
Step 4: Ensure that if using local llm (.env.local for the llm url will indicate localhost:11434 instead of remote url of deepseek) that the server is running or start it with `ollama run deepseek-r1`
Step 5: Run `npm run summarize` to ensure that the summarization is working - ask Commander BMad to validate that he received the email
