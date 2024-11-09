import { WavRecorder } from '../openai-realtime-console/src/lib/wavtools/index.js';
import { GoogleGenerativeAI, DynamicRetrievalMode } from "@google/generative-ai";

async function realtimeKeypoints(setKeypoints) {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-002",
        generationConfig: {
            responseMimeType: "application/json",
          },
    }
    );
    const chat = model.startChat()

    prompt = 'Generate summary of keypoints points, each line with one point. Only say the key points without things like "here is a summary", response in a json list. if there is no key points, use a empty list. Example: ["point 1", "point 2", "point 3"]. only return the points that are available. You will get audio every couple of seconds, give all the keypoints you can find in the audio, EVEN in the past clips. You can merge points in the past clip if they are related.';  
    const wavRecorder = new WavRecorder({ sampleRate: 24000 });
    await wavRecorder.begin();
    await wavRecorder.clear();
    await wavRecorder.record();
    return setInterval(async () => {
        await wavRecorder.pause();
        const audio = await wavRecorder.end();

        const reader = new FileReader();
        reader.readAsDataURL(audio.blob);
        reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1];
            const result = await chat.sendMessage([
                {
                    inlineData: {
                        mimeType: "audio/wav",
                        data: base64data,
                    }
                },
                prompt
            ],
            )
            console.log(JSON.parse(result.response.candidates[0].content.parts[0].text));
            setKeypoints(JSON.parse(result.response.candidates[0].content.parts[0].text));
        }
        await wavRecorder.begin();
        await wavRecorder.clear();
        await wavRecorder.record();

    }, 10000);

}

export { realtimeKeypoints }