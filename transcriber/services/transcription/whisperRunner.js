const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

class WhisperRunner {
  constructor(modelPath = 'whisper/models/ggml-base.en.bin') {
    this.modelPath = modelPath;
    this.timeout = 300000; // 5 minutes default timeout
  }

  async transcribe(filePath, onProcessSpawned) {
    return new Promise(async (resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`Audio file not found: ${filePath}`));
      }

      if (!fs.existsSync(this.modelPath)) {
        return reject(new Error(`Model file not found: ${this.modelPath}`));
      }

      const startTime = Date.now();
      
      // Create unique output base path for JSON file
      const outputBase = path.join(
        path.dirname(filePath),
        `whisper_out_${Date.now()}_${Math.random().toString(36).substring(7)}`
      );
      
      // Build command with whisper.cpp flags
      const whisperBinary = path.join(process.cwd(), 'whisper', 'whisper');
      const args = [
        '-m', this.modelPath,
        '-f', filePath,
        '-oj',           // Output JSON
        '-of', outputBase, // Output file base (without extension)
        '-ng'            // Force CPU mode (no GPU)
      ];
      
      console.log(`[WhisperRunner] Executing: ${whisperBinary} ${args.join(' ')}`);
      
      // Spawn whisper process
      const whisperProcess = spawn(whisperBinary, args, {
        cwd: process.cwd(),
        env: { ...process.env, PATH: process.env.PATH }
      });

      // Notify caller about the spawned process for tracking
      if (onProcessSpawned && typeof onProcessSpawned === 'function') {
        onProcessSpawned(whisperProcess);
      }

      let output = '';
      let errorOutput = '';

      // Capture stdout
      whisperProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
      });

      // Capture stderr
      whisperProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
      });

      // Handle process close
      whisperProcess.on('close', async (code) => {
        const processingTime = Date.now() - startTime;
        
        console.log(`[WhisperRunner] Process exited with code ${code} in ${processingTime}ms`);
        
        if (code === 0) {
          try {
            // Read the JSON output file
            const jsonOutputPath = `${outputBase}.json`;
            
            if (!fs.existsSync(jsonOutputPath)) {
              throw new Error(`JSON output file not found: ${jsonOutputPath}`);
            }
            
            const jsonContent = fs.readFileSync(jsonOutputPath, 'utf8');
            
            // Parse JSON output
            const parsedOutput = this._parseWhisperJsonOutput(jsonContent);
            
            // Clean up JSON file
            try {
              fs.unlinkSync(jsonOutputPath);
            } catch (cleanupError) {
              // Ignore cleanup errors
            }
            
            resolve({
              success: true,
              transcript: parsedOutput,
              processingTime,
              model: path.basename(this.modelPath)
            });
          } catch (parseError) {
            reject(new Error(`Failed to parse whisper output: ${parseError.message}`));
          }
        } else {
          // Clean up any partial output files
          try {
            const jsonOutputPath = `${outputBase}.json`;
            if (fs.existsSync(jsonOutputPath)) {
              fs.unlinkSync(jsonOutputPath);
            }
          } catch (e) {
            // Ignore cleanup errors
          }
          reject(new Error(`Whisper process failed with code ${code}`));
        }
      });

      // Handle process error
      whisperProcess.on('error', (error) => {
        console.error(`[WhisperRunner] Spawn error: ${error.message}`);
        reject(new Error(`Whisper process error: ${error.message}`));
      });

      // Note: Timeout is handled by LiveAudioService which kills the process when session ends
      // This prevents the 5-minute timeout issue when users leave
    });
  }

  _parseWhisperJsonOutput(jsonContent) {
    try {
      const data = JSON.parse(jsonContent);
      
      // Log the entire parsed object for debugging
      console.log("[WhisperRunner] Full JSON structure:");
      console.log(JSON.stringify(data, null, 2).substring(0, 2000));
      
      // Log top-level keys
      console.log("[WhisperRunner] JSON top-level keys:", Object.keys(data));
      
      const result = {
        segments: [],
        text: ''
      };

      // Try to find segments in various possible locations
      let segments = null;
      let segmentsSource = '';
      
      if (data.segments && Array.isArray(data.segments)) {
        segments = data.segments;
        segmentsSource = 'data.segments';
      } else if (data.transcription && Array.isArray(data.transcription)) {
        segments = data.transcription;
        segmentsSource = 'data.transcription';
      } else if (data.result && Array.isArray(data.result)) {
        segments = data.result;
        segmentsSource = 'data.result';
      } else if (data.data && Array.isArray(data.data)) {
        segments = data.data;
        segmentsSource = 'data.data';
      } else if (data.results && Array.isArray(data.results)) {
        segments = data.results;
        segmentsSource = 'data.results';
      }
      
      console.log("[WhisperRunner] Segments source:", segmentsSource || 'none found');
      console.log("[WhisperRunner] Segments found:", segments ? segments.length : 0);
      
      if (segments && segments.length > 0) {
        // Log first segment for verification
        console.log("[WhisperRunner] First segment raw:", JSON.stringify(segments[0]));
        
        segments.forEach((segment, index) => {
          // Normalize segment format
          let start, end, text;
          
          // Handle different timestamp formats
          if (typeof segment.start === 'number') {
            start = segment.start;
          } else if (typeof segment.start === 'string') {
            // Parse timestamp string like "00:00:08.000"
            start = this._parseTimestamp(segment.start);
          } else if (typeof segment.offset === 'number') {
            start = segment.offset;
          } else if (typeof segment.begin === 'number') {
            start = segment.begin;
          } else {
            start = 0;
          }
          
          if (typeof segment.end === 'number') {
            end = segment.end;
          } else if (typeof segment.end === 'string') {
            end = this._parseTimestamp(segment.end);
          } else if (typeof segment.duration === 'number') {
            end = start + segment.duration;
          } else {
            end = start + 1;
          }
          
          // Handle different text field names
          text = (segment.text || segment.transcript || segment.content || segment.utterance || '').trim();
          
          if (text) {
            result.segments.push({ start, end, text });
          }
          
          // Log first few segments for debugging
          if (index < 3) {
            console.log(`[WhisperRunner] Segment ${index}: start=${start}, end=${end}, text="${text.substring(0, 50)}..."`);
          }
        });
      }

      // Extract full text from various possible fields
      result.text = (data.text || data.transcript || data.content || data.utterance || '').trim();
      
      console.log("[WhisperRunner] Total segments extracted:", result.segments.length);
      console.log("[WhisperRunner] Full text length:", result.text.length);

      return result;
    } catch (error) {
      console.error("[WhisperRunner] JSON parse error:", error.message);
      console.error("[WhisperRunner] Raw content preview:", jsonContent.substring(0, 500));
      throw new Error('Failed to parse whisper JSON output: ' + error.message);
    }
  }

  _parseTimestamp(timestamp) {
    if (typeof timestamp !== 'string') return 0;
    
    // Handle formats like "00:00:08.000" or "8.5" or "0:08"
    if (timestamp.includes(':')) {
      const parts = timestamp.split(':');
      if (parts.length === 3) {
        // HH:MM:SS.mmm
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
      } else if (parts.length === 2) {
        // MM:SS.mmm
        return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
      }
    }
    
    // Fallback to direct float parsing
    return parseFloat(timestamp) || 0;
  }

  static validateModelPath(modelPath) {
    return fs.existsSync(modelPath) && path.extname(modelPath) === '.bin';
  }

  static async testWhisperBinary() {
    try {
      const whisperBinary = path.join(process.cwd(), 'whisper', 'whisper');
      console.log(`[WhisperRunner] Testing binary at: ${whisperBinary}`);
      console.log(`[WhisperRunner] Binary exists: ${fs.existsSync(whisperBinary)}`);
      
      if (!fs.existsSync(whisperBinary)) {
        console.error(`[WhisperRunner] Binary not found at ${whisperBinary}`);
        return false;
      }
      
      const testProcess = spawn(whisperBinary, ['-h']);
      let output = '';
      let errorOutput = '';
      
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      testProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      return new Promise((resolve, reject) => {
        testProcess.on('close', (code) => {
          console.log(`[WhisperRunner] Test -h exited with code ${code}`);
          if (output) console.log(`[WhisperRunner] Test stdout: ${output.substring(0, 500)}`);
          if (errorOutput) console.log(`[WhisperRunner] Test stderr: ${errorOutput.substring(0, 500)}`);
          
          if (code === 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        });

        testProcess.on('error', (error) => {
          console.error(`[WhisperRunner] Test spawn error: ${error.message}`);
          resolve(false);
        });
      });
    } catch (error) {
      console.error(`[WhisperRunner] Test exception: ${error.message}`);
      return false;
    }
  }
}

module.exports = WhisperRunner;
