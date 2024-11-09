import { useEffect, useMemo, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { WavRecorder } from '../openai-realtime-console/src/lib/wavtools/index.js';
import { GoogleGenerativeAI, DynamicRetrievalMode } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server"
import './App.css'

async function doc_loop_up(query) {
  return "LMAO"
}

async function web_search(query) {
  return "LMAO"
}

const docSearchDeclaration = {
  name: "doc_loop_up",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query."
      }
    }
  },
};

const webSearchDeclaration = {
  name: "web_search",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query."
      }
    }
  },
};



function App() {
  const videoElem = useRef(null);
  const [audioBase64, setAudioBase64] = useState(null);
  const [wavRecorder, setWavRecorder] = useState(new WavRecorder({ sampleRate: 24000 }));
  const [screenshotBase64, setScreenshotBase64] = useState(null);
  const genAI = useRef(null);
  const model = useRef(null);
  const chat = useRef(null);

  useEffect(() => {
    genAI.current = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_KEY);
    model.current = genAI.current.getGenerativeModel({
      model: "gemini-1.5-flash-002",
      tools: {
        functionDeclarations: [docSearchDeclaration, webSearchDeclaration],
      },
    }
    );
    chat.current = model.current.startChat();
    // console.log(chat.current.sendMessage)
    (async () => { await chat.current.sendMessage(["You are a helpful assistant not a translator. You are a helpful assistant, answer the user do not repeat that. You are connected with a audio transcription and also a vision model. Search doc_loop_up when you need to search within company database. And also web search."]) })()
  }, []);

  const startRecord = async (wavRecorder) => {
    (async (wavRecorder) => {
      // request permissions, connect microphone
      await wavRecorder.begin();
      await wavRecorder.clear();
      wavRecorder.getStatus(); // "paused"

      // Start recording
      // This callback will be triggered in chunks of 8192 samples by default
      // { mono, raw } are Int16Array (PCM16) mono & full channel data
      await wavRecorder.record()
      console.log(wavRecorder.getStatus())
    })(wavRecorder)
  };


  const stopRecord = async () => {
    var canvas = document.getElementById('canvas');
    var video = videoElem.current
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    setScreenshotBase64(canvas.toDataURL('image/jpeg').split(',')[1]);
    var img = canvas.toDataURL('image/jpeg').split(',')[1];

    console.log(wavRecorder.getStatus())
    // Make sure to include these imports:
    // import { GoogleGenerativeAI } from "@google/generative-ai";

    // Stop recording
    await wavRecorder.pause();

    // outputs "audio/wav" audio file
    const audio = await wavRecorder.end();

    // outputs base64 from the blb url
    const reader = new FileReader();
    reader.readAsDataURL(audio.blob);
    reader.onloadend = async () => {
      const base64data = reader.result.split(',')[1];
      console.log(base64data)
      // model.current.generateContent([
      const result = await chat.current.sendMessage([
        // , why the fuck the comma here they is why two requires response touyunuduzikuntouyun
        {
          // functionResponse: "NA",
          inlineData: {
            mimeType: "audio/wav",
            data: base64data,
          }
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: img
          }
        }
      ],
      )
      console.log(result);
      const txt = result.response.text().replaceAll("*", "").replaceAll(":", "").replaceAll("?", "").replaceAll("!", "").replaceAll("`", "").replaceAll("@", "").replaceAll("_", "")
      console.log(txt);
      let utterance = new SpeechSynthesisUtterance(txt);
      utterance.rate = 1;
      // # use chinese
      utterance.lang = "zh-tw"
      if(result.response.functionCalls()){
        console.log(result.response.functionCalls()[0])
      }
    
      speechSynthesis.speak(utterance);

    }
  }
  const displayMediaOptions = {
    video: {
      displaySurface: "browser",
    },
    audio: {
      suppressLocalAudioPlayback: false,
    },
    preferCurrentTab: false,
    selfBrowserSurface: "exclude",
    systemAudio: "include",
    surfaceSwitching: "include",
    monitorTypeSurfaces: "include",
  };

  async function startCapture(displayMediaOptions) {
    let captureStream = null;

    try {
      videoElem.current.srcObject =
        await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    } catch (err) {
      console.error(`Error: ${err}`);
    }
    return captureStream;
  }







  return (
    <>
      <video ref={videoElem} autoPlay hidden></video>
      <canvas id="canvas" width="640" height="480"></canvas>
      <button onClick={startCapture}>Start</button>
      <button onClick={() => { startRecord(wavRecorder) }}>Record</button>
      <button onClick={async () => { stopRecord() }}>Stop</button>

    </>
  )
}

export default App
