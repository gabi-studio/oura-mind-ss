// services/watsonService.js

const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

// Create a new instance of the IBM Watson NLU service
const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
  version: '2022-04-07',
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSON_API_KEY,
  }),
  serviceUrl: process.env.WATSON_API_URL,
});


// Analyze the emotional tone of a given text.
// Returns a score between 0–1 for each of the 5 emotions:
// joy, sadness, anger, fear, and disgust.
// Takes text parameter - The text to analyze.
// Returns Emotion scores { joy: 0.7, sadness: 0.1, ... }
async function analyzeEmotions(text) {
  const analyzeParams = {
    text,
    features: {
      emotion: {},
    },
  };

  try {
    const response = await naturalLanguageUnderstanding.analyze(analyzeParams);
    return response.result.emotion.document.emotion;
  } catch (error) {
    console.error('Error analyzing emotions with Watson:', error);
    throw new Error('Emotion analysis failed');
  }
}

module.exports = {
  analyzeEmotions,
};
