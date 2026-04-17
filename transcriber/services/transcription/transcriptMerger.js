class TranscriptMerger {
  constructor() {
    this.MAX_SEGMENT_DURATION = 30; // Maximum segment duration in seconds
  }

  mergeTranscripts(userTranscripts) {
    if (!Array.isArray(userTranscripts) || userTranscripts.length === 0) {
      return {
        timeline: [],
        text: '',
        participants: new Set()
      };
    }

    // Flatten all segments and sort by start time
    const allSegments = [];
    const participants = new Set();

    userTranscripts.forEach(transcript => {
      if (transcript.success && transcript.transcript && transcript.transcript.segments) {
        participants.add(transcript.userId);
        
        transcript.transcript.segments.forEach(segment => {
          if (segment.start && segment.end && segment.text) {
            allSegments.push({
              userId: transcript.userId,
              start: parseFloat(segment.start),
              end: parseFloat(segment.end),
              text: segment.text.trim(),
              duration: parseFloat(segment.end) - parseFloat(segment.start)
            });
          }
        });
      }
    });

    // Sort segments by start time
    allSegments.sort((a, b) => a.start - b.start);

    // Merge overlapping segments
    const mergedTimeline = this._mergeOverlappingSegments(allSegments);

    // Generate final text
    const finalText = mergedTimeline.map(segment => 
      `[${this._formatTime(segment.start)}] ${segment.userId}: ${segment.text}`
    ).join('\n');

    return {
      timeline: mergedTimeline,
      text: finalText,
      participants: Array.from(participants),
      duration: mergedTimeline.length > 0 ? 
        Math.round(mergedTimeline[mergedTimeline.length - 1].end * 100) / 100 : 0
    };
  }

  _mergeOverlappingSegments(segments) {
    if (segments.length < 2) return segments;

    const merged = [];
    let currentSegment = segments[0];

    for (let i = 1; i < segments.length; i++) {
      const nextSegment = segments[i];
      
      // Check if segments overlap or are contiguous
      if (nextSegment.start <= currentSegment.end + 0.5) {
        // Merge segments
        currentSegment = {
          userId: currentSegment.userId,
          start: Math.min(currentSegment.start, nextSegment.start),
          end: Math.max(currentSegment.end, nextSegment.end),
          text: currentSegment.text + ' ' + nextSegment.text,
          duration: Math.max(currentSegment.end, nextSegment.end) - Math.min(currentSegment.start, nextSegment.start)
        };
      } else {
        // Add current segment and move to next
        merged.push(currentSegment);
        currentSegment = nextSegment;
      }
    }
    
    // Add the last segment
    merged.push(currentSegment);
    
    return merged;
  }

  _formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  splitIntoSentences(timeline) {
    const sentences = [];
    
    timeline.forEach(segment => {
      const text = segment.text;
      const sentencesInSegment = text.split(/[.!?]+/).filter(s => s.trim());
      
      sentencesInSegment.forEach((sentence, index) => {
        const sentenceDuration = segment.duration / sentencesInSegment.length;
        sentences.push({
          userId: segment.userId,
          start: segment.start + (index * sentenceDuration),
          end: segment.start + ((index + 1) * sentenceDuration),
          text: sentence.trim(),
          originalSegment: segment
        });
      });
    });
    
    return sentences.sort((a, b) => a.start - b.start);
  }

  extractKeyPhrases(timeline, topN = 5) {
    const wordFrequency = {};
    const sentences = this.splitIntoSentences(timeline);
    
    // Simple word frequency analysis
    sentences.forEach(sentence => {
      const words = sentence.text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !this._isStopWord(word));
      
      words.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      });
    });
    
    // Get top N words
    return Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([word, count]) => ({ word, count }));
  }

  _isStopWord(word) {
    const stopWords = new Set([
      'the', 'and', 'that', 'this', 'with', 'from', 'have', 'for',
      'not', 'but', 'are', 'was', 'were', 'you', 'they', 'we',
      'our', 'your', 'their', 'its', 'about', 'which', 'who',
      'what', 'when', 'where', 'why', 'how', 'all', 'any',
      'some', 'such', 'no', 'nor', 'too', 'very', 'can',
      'will', 'just', 'should', 'would', 'could', 'may',
      'might', 'must', 'shall', 'ought'
    ]);
    return stopWords.has(word);
  }

  generateConversationFlow(timeline) {
    const flow = {
      speakers: {},
      topics: [],
      transitions: []
    };

    const sentences = this.splitIntoSentences(timeline);
    
    // Track speaker activity
    sentences.forEach((sentence, index) => {
      const speaker = sentence.userId;
      if (!flow.speakers[speaker]) {
        flow.speakers[speaker] = {
          totalWords: 0,
          totalSentences: 0,
          speakingTime: 0,
          interruptions: 0
        };
      }
      
      const words = sentence.text.split(/\s+/).length;
      flow.speakers[speaker].totalWords += words;
      flow.speakers[speaker].totalSentences++;
      flow.speakers[speaker].speakingTime += sentence.end - sentence.start;
      
      // Check for interruptions
      if (index > 0) {
        const prevSentence = sentences[index - 1];

        if (prevSentence.userId !== speaker && 
            sentence.start - prevSentence.end < 0.5) {
          flow.speakers[speaker].interruptions++;

          if (flow.speakers[prevSentence.userId]) {
            flow.speakers[prevSentence.userId].interruptions++;
          }
        }
      }
    });

    // Calculate topic transitions
    const topicWindow = 10; // seconds
    const topicSegments = [];
    
    sentences.forEach(sentence => {
      const windowStart = Math.floor(sentence.start / topicWindow) * topicWindow;
      if (!topicSegments[windowStart]) {
        topicSegments[windowStart] = {
          start: windowStart,
          end: windowStart + topicWindow,
          speakers: {},
          keywords: new Set()
        };
      }
      
      topicSegments[windowStart].speakers[sentence.userId] = 
        (topicSegments[windowStart].speakers[sentence.userId] || 0) + 1;
      
      // Extract keywords from sentence
      const keywords = this.extractKeyPhrases([{
        userId: sentence.userId,
        start: sentence.start,
        end: sentence.end,
        text: sentence.text
      }], 3);
      
      keywords.forEach(keyword => {
        topicSegments[windowStart].keywords.add(keyword.word);
      });
    });
    
    flow.topics = topicSegments.filter(Boolean);
    
    return flow;
  }
}

module.exports = TranscriptMerger;