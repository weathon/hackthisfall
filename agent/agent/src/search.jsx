import {
    DynamicRetrievalMode,
    GoogleGenerativeAI,
} from "@google/generative-ai";


async function search(query) {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_KEY);
    const model = genAI.getGenerativeModel(
        {
            model: "gemini-1.5-pro",
              tools: [
                {
                  googleSearchRetrieval: {
                    dynamicRetrievalConfig: {
                      mode: DynamicRetrievalMode.MODE_DYNAMIC,
                      dynamicThreshold: 0.7,
                    },
                  },
                },
              ],
        },
        // { apiVersion: "v1beta" },
    );

    const prompt = "Use your internet tool to look up information. You have to look it up for real time information. Remember you can access the internet. Do NOT say you do not have real time access because you DO!!!!!" + query;
    const result = await model.generateContent(prompt);
    return result.response.candidates[0].content.parts[0].text
}


export { search };