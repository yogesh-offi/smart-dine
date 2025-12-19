import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getRagContext(query) {
  return new Promise((resolve, reject) => {
    // 🔥 ABSOLUTE path to ml/rag_runner.py
    const scriptPath = path.join(__dirname, "..", "..", "ml", "rag_runner.py");
    const pythonPath = path.resolve(__dirname, "..", "..", "ml", "venv", "Scripts", "python.exe");

    execFile(pythonPath, [scriptPath, query], (err, stdout, stderr) => {
      if (err) {
        console.error("❌ RAG Python error:", stderr);
        return reject(err);
      }
      resolve(stdout.trim());
    });
  });
}
