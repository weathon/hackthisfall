import { useEffect, useMemo, useRef, useState } from 'react'
import { WavRecorder } from '../openai-realtime-console/src/lib/wavtools/index.js';
import { GoogleGenerativeAI, DynamicRetrievalMode } from "@google/generative-ai";
import { search } from './search'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import { realtimeKeypoints } from './realtimeKeypoints'
import { summary } from './summary'
import './App.css'

async function doc_loop_up(query) {
  return "LMAO"
}

async function web_search(query) {
  return await search(query)
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



// function App() {
 
//   return (
//     <>
//       <video ref={videoElem} autoPlay poster="image.png" style={{ margin: "20px" }}></video>
//       <Container>
//         <Row>
//           <Col xs={8}>

//           </Col>
//           <Col>
//             <h1>Realtime Keypoints</h1>
//             {
//               <ul>
//                 {
//                   keypoints && keypoints.map((keypoint, i) => {
//                     return (
//                       <li key={i}>
//                         {keypoint}
//                       </li>
//                     )
//                   })
//                 }
//               </ul>
//             }
//           </Col>
//         </Row>
//       </Container>
//       <Button style={{ margin: "3px" }} onClick={startCapture}>Start</Button>
//       {/* <Button style={{ margin: "3px" }} onClick={() => { }}>Record</Button> */}
//       <Button style={{ margin: "3px" }} onClick={async () => {  }}>Stop</Button>
//       <Button onClick={() => { summary(chat) }}>Generate Summary</Button>
//       <Button onClick={() => { r }}>Start Realtime Keypoints</Button>

//     </>
//   )
// }



const App = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [keypoints, setKeypoints] = useState([]);

  const handleMeetingStart = () => {
    setIsStarted(true);
    startCapture()
  };

  const handleAISpeaker = () => {
    console.log('AI Speaker activated...');
    stopRecord()
  };

  const handleMeetingEnd = async () => {
    setIsStarted(false);
    await wavRecorder.pause();  
    await wavRecorder.end();
    summary(chat)
    clearInterval(runnerId);
  };

  const [runnerId, setRunnerId] = useState(null);
  const handleRealtimeKeypoints = () => {
    console.log('Starting realtime keypoints...');
    setRunnerId(realtimeKeypoints(setKeypoints))
    };

    const videoElem = useRef(null);
    const [audioBase64, setAudioBase64] = useState(null);
    const [wavRecorder, setWavRecorder] = useState(new WavRecorder({ sampleRate: 24000 }));
    const [screenshotBase64, setScreenshotBase64] = useState(null);
    // const [keypoints, setKeypoints] = useState(null);
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
      (async () => { await chat.current.sendMessage(["Your name is Sandy and you are a helpful assistant not a translator. You are a helpful assistant, answer the user do not repeat that. You are connected with a audio transcription and also a vision model so you can hear and see the screen. Search doc_loop_up when you need to search within company database. And also web search. Make sure you use the tool when told to. "]) })()
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
        // # use chinese
        // utterance.lang = "zh-tw"
        if (result.response.functionCalls()) {
          let utterance = new SpeechSynthesisUtterance(txt);
          utterance.rate = 1;
          speechSynthesis.speak(utterance);
          console.log(result.response.functionCalls()[0])
          if (result.response.functionCalls()[0].name == "web_search") {
            var query = result.response.functionCalls()[0].args.query
            var res = await web_search(query)
  
            console.log(res)
            var result2 = await chat.current.sendMessage([{
              functionResponse: {
                name: 'web_search',
                response: {
                  "text": res
                }
              }
            }])
            let utterance = new SpeechSynthesisUtterance(result2.response.text());
            utterance.rate = 1;
            speechSynthesis.speak(utterance);
            utterance.onend = () => {
              console.log("start again")
              startRecord(wavRecorder)
            }
          }
        }
        else {
          let utterance = new SpeechSynthesisUtterance(txt);
          utterance.rate = 1;
          speechSynthesis.speak(utterance);
          utterance.onend = () => {
            console.log("start again")
            startRecord(wavRecorder)
          }
        }
  
  
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
      startRecord(wavRecorder)
      return captureStream;
    }
  
  

    
  return (
    <div className="flex w-full min-h-screen p-8 gap-12">
      {/* Left column - Video and Controls (3/5) */}
      <div className="w-3/5 flex flex-col space-y-8">
        {/* Video container with more padding */}
        <div className="w-full bg-black rounded-xl border-2 border-orange-800">
        <video ref={videoElem} autoPlay className='w-full'></video>
        <canvas id="canvas" width="50%" height="480" hidden></canvas>
        </div>
        
        {/* Centered buttons container */}
        <div className="flex flex-col items-center"> 
          <div className="flex flex-wrap gap-6 justify-center"> 
            <button
              onClick={handleMeetingStart}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg"
            >
              Meeting Start
            </button>
            
            <button
              onClick={handleAISpeaker}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg"
            >
              AI's Turn
            </button>
            
            <button
              onClick={handleMeetingEnd}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg"
            >
              Meeting End
            </button>
            
            <button
              onClick={handleRealtimeKeypoints}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg"
            >
              Realtime Keypoints Start
            </button>
          </div>
        </div>
      </div>

      {/* Right column - Keypoints Display (2/5) */}
      <div className="w-2/5 flex flex-col">
        {/* Title centered in the right column */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Realtime Keypoints</h1>
        </div>

        {/* Stack layout for keypoints with more spacing */}
        <div className="flex flex-col gap-4">
          {keypoints.length > 0 ? (
            keypoints.map((keypoint, index) => (
              <div 
                key={index} 
                className="p-4 bg-gray-100 rounded-lg shadow-md hover:bg-gray-200 transition-colors"
              >
                {keypoint}
              </div>
            ))
          ) : (
            <div className="p-4 text-gray-500 text-center">
              No keypoints generated yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



export default App
