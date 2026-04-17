class SummaryService {
  constructor() {}

  async generateSummary(meetingData) {
    const {
      title,
      participants,
      duration,
      transcriptText,
      timeline
    } = meetingData;

    // Basic structured summary (non-AI rule-based)
    const wordCount = transcriptText
      ? transcriptText.split(/\s+/).length
      : 0;

    const speakerStats = this.calculateSpeakerStats(timeline);

    const summary = {
      title: title || "Untitled Meeting",
      overview: `Meeting with ${participants.length} participant(s) lasting ${duration} seconds.`,
      wordCount,
      participants,
      speakerStats,
      keyPoints: this.extractKeyPoints(transcriptText),
      actionItems: this.extractActionItems(transcriptText)
    };

    return { summary };
  }

  calculateSpeakerStats(timeline = []) {
    const stats = {};

    for (const entry of timeline) {
      if (!stats[entry.userId]) {
        stats[entry.userId] = {
          totalSpeakingTime: 0,
          segments: 0
        };
      }

      stats[entry.userId].totalSpeakingTime += entry.duration || 0;
      stats[entry.userId].segments += 1;
    }

    return stats;
  }

  extractKeyPoints(text = "") {
    if (!text) return [];

    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 10);

    return sentences.slice(0, 5).map(s => s.trim());
  }

  extractActionItems(text = "") {
    if (!text) return [];

    const actionKeywords = ["will", "should", "need to", "must", "plan to"];
    const sentences = text.split(/[.!?]/);

    return sentences
      .filter(sentence =>
        actionKeywords.some(keyword =>
          sentence.toLowerCase().includes(keyword)
        )
      )
      .map(s => s.trim())
      .slice(0, 5);
  }
}

module.exports = SummaryService;
