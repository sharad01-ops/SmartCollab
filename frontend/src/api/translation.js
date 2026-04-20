import translate from 'google-translate-api-x';

export async function translateWithFallback(text, target) {
  try {
    // later replace this with your model
    throw new Error("Model not ready");
  } catch (e) {
    const res = await translate(text, { to: target });
    return res.text;
  }
}


