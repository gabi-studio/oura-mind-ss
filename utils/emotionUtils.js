//
// Returns top 2 emotions above a threshold, sorted by intensity
// Currently the threshold is set 0.3
// Returns array of [emotion, intensity] pairs


const emotionThreshold = 0.3;

exports.getTopEmotions = (emotions, limit = 2, threshold = emotionThreshold) => {
  return Object.entries(emotions)
    .filter(([_, intensity]) => intensity >= threshold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit); 
};
