export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const { fileName, content, title, description } = req.body;

  const TOKEN = "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";
  const OWNER = "saikrishna1235";
  const REPO = "Photo_Studio";

  try {
    // Upload image
    await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/images/${fileName}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Upload image",
        content: content
      })
    });

    // Get JSON
    const fileRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/data.json`, {
      headers: {
        Authorization: `token ${TOKEN}`
      }
    });

    const file = await fileRes.json();

    if (!file.content) {
      console.error(file);
      return res.status(500).json({ success: false });
    }

    const current = JSON.parse(Buffer.from(file.content, "base64").toString());

    // Add new photo
    current.photos.push({
      title,
      image: `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/images/${fileName}`,
      description
    });

    // Update JSON
    await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/data.json`, {
      method: "PUT",
      headers: {
        Authorization: `token ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Update JSON",
        content: Buffer.from(JSON.stringify(current, null, 2)).toString("base64"),
        sha: file.sha
      })
    });

    res.status(200).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}
