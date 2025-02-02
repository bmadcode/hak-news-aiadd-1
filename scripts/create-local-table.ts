import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';

async function createLocalTable() {
  const client = new DynamoDBClient({
    endpoint: 'http://localhost:8000',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
  });

  try {
    const command = new CreateTableCommand({
      TableName: 'hak-news-subscriptions',
      AttributeDefinitions: [
        { AttributeName: 'pk', AttributeType: 'S' },
        { AttributeName: 'sk', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    });

    const response = await client.send(command);
    console.log(
      'Table created successfully:',
      response.TableDescription?.TableName,
    );
  } catch (error) {
    if ((error as Error).name === 'ResourceInUseException') {
      console.log('Table already exists');
    } else {
      console.error('Error creating table:', error);
    }
  }
}

createLocalTable();
