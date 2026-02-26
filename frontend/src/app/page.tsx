"use client";

import { useEffect, useState } from "react";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

interface RetrievedChunk {
  text: string;
  score: number;
}

export default function Home() {

  const [sessionId, setSessionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(Date.now());
  const [uploadedDoc, setUploadedDoc] = useState("");
  const [uploadMsg, setUploadMsg] = useState("");

  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [retrieved, setRetrieved] = useState<RetrievedChunk[]>([]);

  const [documents, setDocuments] = useState(0);
  const [chunks, setChunks] = useState(0);

  const [topK, setTopK] = useState(3);
  const [threshold, setThreshold] = useState(0.3);
  const [chunkSize, setChunkSize] = useState(500);
  const [overlap, setOverlap] = useState(50);

  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [lastRetrievedCount, setLastRetrievedCount] = useState(0);

  useEffect(() => {
    createSession();
  }, []);

  const createSession = async () => {
    const res = await fetch("http://localhost:5000/session");
    const data = await res.json();
    setSessionId(data.sessionId);
  };

  const loadStats = async (sid: string) => {
    const res = await fetch("http://localhost:5000/session-stats", {
      headers: { sessionid: sid }
    });
    const data = await res.json();
    setDocuments(data.documents);
    setChunks(data.chunks);
  };

  const newSession = async () => {
    const res = await fetch("http://localhost:5000/session");
    const data = await res.json();

    setSessionId(data.sessionId);
    setChatHistory([]);
    setRetrieved([]);
    setDocuments(0);
    setChunks(0);
    setFile(null);
    setUploadedDoc("");
    setUploadMsg("");
    setFileKey(Date.now());
  };

  const clearSession = async () => {
    await fetch("http://localhost:5000/session-stats", {
      method: "DELETE",
      headers: { sessionid: sessionId }
    });

    setChatHistory([]);
    setRetrieved([]);
    setDocuments(0);
    setChunks(0);
    setFile(null);
    setUploadedDoc("");
    setUploadMsg("");
    setFileKey(Date.now());
  };

  const uploadFile = async (selected?: File) => {

    const target = selected || file;
    if (!target) return;

    const formData = new FormData();
    formData.append("file", target);

    await fetch("http://localhost:5000/upload", {
      method: "POST",
      headers: { sessionid: sessionId },
      body: formData
    });

    setUploadedDoc(target.name);
    setUploadMsg("File uploaded successfully");
    loadStats(sessionId);
    setFileKey(Date.now());
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      uploadFile(dropped);
    }
  };

  const askQuestion = async () => {

    if (!question.trim()) return;

    const start = Date.now();

    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        sessionid: sessionId
      },
      body: JSON.stringify({ question, topK, threshold })
    });

    const data = await res.json();

    const end = Date.now();

    setResponseTime(end - start);
    setLastRetrievedCount(data.retrieved?.length || 0);

    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "ai", content: data.answer }
    ]);

    setRetrieved(data.retrieved || []);
    setQuestion("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0b1220] to-[#020617] text-gray-200 p-6 flex flex-col gap-6">

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-400 flex gap-2 items-center">
            🤖 DocScope-RAG
          </h1>
          <p className="text-sm text-gray-400">
            Session-Based Retrieval-Augmented Generation
          </p>
        </div>

        <span className="px-3 py-1 text-xs bg-green-600/20 text-green-400 rounded-full">
          ● Active Session
        </span>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* SESSION */}
        <div className="bg-[#111827]/70 backdrop-blur border border-gray-700/70 rounded-xl p-5 shadow-[0_0_20px_rgba(59,130,246,0.08)] hover:scale-[1.01] transition">

          <h2 className="text-blue-400 font-semibold mb-3">🧾 Session</h2>

          <p className="text-xs text-gray-500">Session ID</p>
          <p className="text-blue-400 text-xs break-all">{sessionId}</p>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Documents</span>
              <span>{documents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Chunks</span>
              <span>{chunks}</span>
            </div>
          </div>

          {uploadedDoc && (
            <p className="text-green-400 mt-3 text-sm">{uploadedDoc}</p>
          )}

          <div className="flex gap-2 mt-5">
            <button onClick={clearSession}
              className="w-full bg-red-600 hover:bg-red-700 py-2 rounded">
              Clear
            </button>

            <button onClick={newSession}
              className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded">
              New
            </button>
          </div>
        </div>

        {/* UPLOAD */}
        <div className="bg-[#111827]/70 backdrop-blur border border-gray-700/70 rounded-xl p-5 shadow-[0_0_20px_rgba(59,130,246,0.08)] hover:scale-[1.01] transition">
          <h2 className="text-blue-400 font-semibold mb-3">📂 Upload</h2>

          <div
            onDragOver={(e)=>e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-600 rounded-lg p-10 text-center hover:bg-gray-800 transition"
          >
            Drag & Drop or
            <label className="text-blue-400 cursor-pointer ml-2">
              Browse
              <input
                key={fileKey}
                type="file"
                className="hidden"
                onChange={(e)=>setFile(e.target.files ? e.target.files[0] : null)}
              />
            </label>
          </div>

          {file && <p className="text-sm mt-2">{file.name}</p>}
          {uploadMsg && <p className="text-green-400">{uploadMsg}</p>}

          <button
            onClick={()=>uploadFile()}
            className="bg-blue-600 hover:bg-blue-700 py-2 rounded mt-3 w-full"
          >
            Upload File
          </button>
        </div>

        {/* ASK */}
        <div className="bg-[#111827]/70 backdrop-blur border border-gray-700/70 rounded-xl p-5 shadow-[0_0_20px_rgba(59,130,246,0.08)] hover:scale-[1.01] transition">
          <h2 className="text-blue-400 font-semibold mb-3">❓ Ask Question</h2>

          <textarea
            value={question}
            onChange={(e)=>setQuestion(e.target.value)}
            className="bg-[#020617] border border-gray-700 rounded p-3 text-sm w-full"
          />

          <button
            onClick={askQuestion}
            className="bg-blue-600 hover:bg-blue-700 py-2 rounded mt-3 w-full"
          >
            Ask
          </button>
        </div>
      </div>

      {/* CHAT + SETTINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-[#111827]/70 backdrop-blur border border-gray-700/70 rounded-xl p-5 shadow-[0_0_20px_rgba(59,130,246,0.08)] max-h-[420px] overflow-y-auto">
          <h2 className="text-blue-400 font-semibold mb-3">💬 Chat</h2>

          {chatHistory.map((msg,index)=>(
            <div key={index}
              className={`p-3 rounded-lg text-sm mb-2 animate-[fadeIn_0.25s_ease] ${
                msg.role==="user"
                ? "bg-blue-600 ml-auto max-w-[70%]"
                : "bg-gray-700 max-w-[70%]"
              }`}>
              {msg.content}
            </div>
          ))}
        </div>

        <div className="bg-[#111827]/70 backdrop-blur border border-gray-700/70 rounded-xl p-5 shadow-[0_0_20px_rgba(59,130,246,0.08)]">
          <h2 className="text-blue-400 font-semibold mb-3">⚙️ Retrieval Settings</h2>

          <p>Top K: {topK}</p>
          <input type="range" min="1" max="5"
            value={topK} onChange={(e)=>setTopK(Number(e.target.value))}
            className="w-full"/>

          <p className="mt-3">Threshold: {threshold.toFixed(2)}</p>
          <input type="range" min="0" max="1" step="0.05"
            value={threshold} onChange={(e)=>setThreshold(Number(e.target.value))}
            className="w-full"/>

          <p className="mt-3">Chunk Size: {chunkSize}</p>
          <input type="range" min="200" max="1000"
            value={chunkSize} onChange={(e)=>setChunkSize(Number(e.target.value))}
            className="w-full"/>

          <p className="mt-3">Overlap: {overlap}</p>
          <input type="range" min="0" max="200"
            value={overlap} onChange={(e)=>setOverlap(Number(e.target.value))}
            className="w-full"/>
        </div>
      </div>

      {/* RETRIEVAL INFO */}
      <div className="bg-[#111827]/70 backdrop-blur border border-gray-700/70 rounded-xl p-5 shadow-[0_0_20px_rgba(59,130,246,0.08)]">
        <h2 className="text-blue-400 font-semibold mb-3">🔍 Retrieval Info</h2>

        <div className="text-sm space-y-1 text-gray-300">
          <p>TopK Used: <span className="text-blue-400">{topK}</span></p>
          <p>Threshold Used: <span className="text-blue-400">{threshold.toFixed(2)}</span></p>
          <p>Total Chunks Stored: <span className="text-blue-400">{chunks}</span></p>
          <p>Chunks Retrieved: <span className="text-blue-400">{lastRetrievedCount}</span></p>
          {responseTime !== null && (
            <p>Response Time: <span className="text-green-400">{responseTime} ms</span></p>
          )}
        </div>
      </div>

      {/* RETRIEVED CHUNKS */}
      {retrieved.length>0 && (
        <div className="bg-[#111827]/70 backdrop-blur border border-gray-700/70 rounded-xl p-5 shadow-[0_0_20px_rgba(59,130,246,0.08)]">
          <h2 className="text-blue-400 font-semibold mb-3">🧠 Retrieved Chunks</h2>

          {retrieved.map((r,i)=>(
            <div key={i} className="bg-gray-800 p-3 rounded mb-2 text-sm">
              {r.text}
              <p className="text-xs text-gray-400 mt-1">
                Similarity: {r.score.toFixed(3)}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}