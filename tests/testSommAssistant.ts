import { chatCompletion } from "../server/openai";
import type { WineData } from "../shared/wine";
import 'dotenv/config';

// Simulated wine scanned from QR code
const mockWineData: WineData = {
  id: 1234,
  name: "Cabernet Sauvignon Reserve",
  year: "2022",
  ratings: {
    vn: 91,
    jd: 94,
    ws: 90,
    abv: 14.2
  },
  bottles: 185
};

// Simulated user chat flow
const testMessages = [
  {
    role: "user" as const,
    content: "Hi there! I just opened this bottle — tell me more about it?"
  },
  {
    role: "user" as const,
    content: "What food would go well with this?"
  },
  {
    role: "user" as const,
    content: "Are there any other wines from this winery I should try?"
  }
];

async function runTest() {
  let memory = {};
  let messages: { role: "user" | "assistant" | "system"; content: string }[] = [];

  for (let i = 0; i < testMessages.length; i++) {
    messages.push(testMessages[i]);

    const userQuestion = testMessages[i].content;
    const result = await chatCompletion({
      messages,
      wineData: mockWineData,
      userId: "test-user-123",
      memory,
      newWineId: mockWineData.id,
      userQuestion,
      wines: [
        mockWineData,
        {
          id: 2345,
          name: "Chardonnay Estate",
          year: "2021"
        },
        {
          id: 3456,
          name: "Pinot Noir Signature",
          year: "2020"
        }
      ]
    });

    messages.push({
      role: "assistant",
      content: result.content
    });

    memory = result.updatedMemory ?? {};

    console.log(`\n🔹 User: ${userQuestion}`);
    console.log(`🤖 Assistant:\n${result.content}`);
    if (result.usage) {
      console.log(`📊 Tokens Used — Total: ${result.usage.total_tokens}, Prompt: ${result.usage.prompt_tokens}, Completion: ${result.usage.completion_tokens}`);
    }
  }

  console.log("\n✅ Test completed.\nMemory snapshot:", memory);
}

runTest().catch(console.error); 